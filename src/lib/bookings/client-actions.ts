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
});

class InsufficientBalanceError extends Error {}

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

  const { placeId, date, time, durationHours } = parsed.data;
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

  try {
    await prisma.$transaction(async (tx) => {
      // conditional decrement doubles as a race-proof insufficient-funds check
      const paid = await tx.client.updateMany({
        where: { id: clientId, balance: { gte: totalPrice } },
        data: { balance: { decrement: totalPrice } },
      });
      if (paid.count === 0) throw new InsufficientBalanceError();

      const booking = await tx.booking.create({
        data: {
          placeId,
          clientId,
          startsAt,
          endsAt,
          pricePerHourSnapshot: pricePerHour,
          totalPrice,
          status: "ACTIVE",
          source: "CLIENT",
        },
      });

      await tx.balanceTransaction.create({
        data: {
          clientId,
          bookingId: booking.id,
          type: "BOOKING_CHARGE",
          amount: -totalPrice,
        },
      });
    });
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      return fail(
        "Insufficient balance. Please top up your account on your profile page."
      );
    }
    // exclusion constraint fired: tx rolled back, balance restored
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
