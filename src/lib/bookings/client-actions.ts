"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/auth/require-client";
import { ActionResult, ok, fail } from "@/lib/action-result";
import {
  findConflict,
  calcTotalPrice,
  isExclusionViolation,
  CONFLICT_MESSAGE,
} from "@/lib/bookings/availability";
import { cancelBookingWithRefund } from "@/lib/bookings/cancel";
import { clubTimeToDate } from "@/lib/format";

const DURATION_CHOICES = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];
const MAX_UPCOMING_BOOKINGS = 3;
const MAX_DAYS_AHEAD = 30;

const createSchema = z.object({
  placeId: z.string().min(1, "Select a place"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Enter a time"),
  durationHours: z.coerce
    .number()
    .refine((v) => DURATION_CHOICES.includes(v), "Invalid duration"),
  snacks: z
    .array(
      z.object({
        snackId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(20),
      })
    )
    .optional()
    .default([]),
});

function revalidate() {
  revalidatePath("/account");
  revalidatePath("/book");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/clients");
}

export async function createClientBooking(input: unknown): Promise<ActionResult> {
  const clientId = await requireClientId();

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { placeId, date, time, durationHours, snacks } = parsed.data;
  const startsAt = clubTimeToDate(date, time);
  const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);
  const now = Date.now();

  if (startsAt.getTime() < now + 5 * 60_000) {
    return fail("Start time must be in the future");
  }
  if (startsAt.getTime() > now + MAX_DAYS_AHEAD * 86_400_000) {
    return fail(`Bookings can be made up to ${MAX_DAYS_AHEAD} days ahead`);
  }

  const upcoming = await prisma.booking.count({
    where: { clientId, status: "ACTIVE", endsAt: { gt: new Date(now) } },
  });
  if (upcoming >= MAX_UPCOMING_BOOKINGS) {
    return fail(
      `You already have ${MAX_UPCOMING_BOOKINGS} upcoming bookings. Cancel one to book a new slot.`
    );
  }

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) return fail("Place not found");
  if (place.status !== "ACTIVE") return fail("This place is currently unavailable");

  const conflict = await findConflict(placeId, startsAt, endsAt);
  if (conflict) return fail(CONFLICT_MESSAGE);

  const pricePerHour = Number(place.pricePerHour);
  const totalPrice = calcTotalPrice(pricePerHour, startsAt, endsAt);

  // resolve requested snacks against the catalogue (price snapshot, availability)
  const snackRows: { snackId: string; quantity: number; priceSnapshot: number }[] =
    [];
  if (snacks.length > 0) {
    const ids = [...new Set(snacks.map((s) => s.snackId))];
    const catalogue = await prisma.snack.findMany({
      where: { id: { in: ids }, isAvailable: true },
    });
    const byId = new Map(catalogue.map((s) => [s.id, s]));
    for (const s of snacks) {
      const snack = byId.get(s.snackId);
      if (!snack) continue; // silently drop unavailable snacks
      snackRows.push({
        snackId: snack.id,
        quantity: s.quantity,
        priceSnapshot: Number(snack.price),
      });
    }
  }

  // No payment/balance charge (MVP): a booking is a free reservation, paid at the club.
  try {
    await prisma.booking.create({
      data: {
        placeId,
        clientId,
        startsAt,
        endsAt,
        pricePerHourSnapshot: pricePerHour,
        totalPrice,
        status: "ACTIVE",
        source: "CLIENT",
        snacks: snackRows.length
          ? { create: snackRows }
          : undefined,
      },
    });
  } catch (e) {
    // fallback: the DB exclusion constraint closes the race the pre-check can't
    if (isExclusionViolation(e)) return fail(CONFLICT_MESSAGE);
    throw e;
  }

  revalidate();
  return ok();
}

export async function cancelClientBooking(bookingId: string): Promise<ActionResult> {
  const clientId = await requireClientId();

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.clientId !== clientId) return fail("Booking not found");
  if (booking.status === "CANCELLED") return fail("Booking is already cancelled");
  if (booking.startsAt.getTime() <= Date.now()) {
    return fail("This booking has already started and cannot be cancelled");
  }

  const outcome = await cancelBookingWithRefund(bookingId);
  if (!outcome.ok) {
    return fail(
      outcome.error === "not_found" ? "Booking not found" : "Booking is already cancelled"
    );
  }

  revalidate();
  return ok();
}
