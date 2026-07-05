"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";
import {
  findConflict,
  calcTotalPrice,
  isExclusionViolation,
  CONFLICT_MESSAGE,
} from "@/lib/bookings/availability";
import { cancelBookingWithRefund } from "@/lib/bookings/cancel";
import { clubTimeToDate } from "@/lib/format";

const createBookingSchema = z.object({
  placeId: z.string().min(1, "Select a place"),
  clientId: z.string().min(1, "Select a client"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Enter a time"),
  durationHours: z.coerce
    .number()
    .min(0.5, "Minimum duration is 30 minutes")
    .max(24, "Maximum duration is 24 hours"),
});

function revalidate() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/clients");
}

export async function createBooking(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { placeId, clientId, date, time, durationHours } = parsed.data;
  const startsAt = clubTimeToDate(date, time);
  const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);

  if (startsAt.getTime() < Date.now() - 5 * 60_000) {
    return fail("Cannot create a booking in the past");
  }

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) return fail("Place not found");
  if (place.status !== "ACTIVE") return fail("This place is currently unavailable");

  const conflict = await findConflict(placeId, startsAt, endsAt);
  if (conflict) return fail(CONFLICT_MESSAGE);

  const pricePerHour = Number(place.pricePerHour);

  try {
    await prisma.booking.create({
      data: {
        placeId,
        clientId,
        startsAt,
        endsAt,
        pricePerHourSnapshot: pricePerHour,
        totalPrice: calcTotalPrice(pricePerHour, startsAt, endsAt),
        status: "ACTIVE",
        source: "ADMIN",
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

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<ActionResult> {
  await requireAdmin();

  // client-paid bookings are refunded to the client's balance inside the helper
  const outcome = await cancelBookingWithRefund(bookingId, reason);
  if (!outcome.ok) {
    return fail(
      outcome.error === "not_found" ? "Booking not found" : "Booking is already cancelled"
    );
  }

  revalidate();
  return ok();
}
