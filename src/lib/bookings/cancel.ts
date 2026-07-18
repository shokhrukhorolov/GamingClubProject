import { prisma } from "@/lib/prisma";

export type CancelOutcome =
  | { ok: true }
  | { ok: false; error: "not_found" | "already_cancelled" };

/**
 * Cancels a booking. Bookings no longer charge the balance (free reservations),
 * but LEGACY bookings that carry a BOOKING_CHARGE ledger row are refunded in full
 * when cancelled. New bookings have no charge, so cancelling just flips the status.
 */
export async function cancelBookingWithRefund(
  bookingId: string,
  reason?: string
): Promise<CancelOutcome> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "not_found" };
  if (booking.status === "CANCELLED") return { ok: false, error: "already_cancelled" };

  // sum of charges already applied to this booking (negative amounts)
  const charged = await prisma.balanceTransaction.aggregate({
    where: { bookingId, type: "BOOKING_CHARGE" },
    _sum: { amount: true },
  });
  const refund = -Number(charged._sum.amount ?? 0); // positive amount to give back

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason?.trim() || null,
      },
    });

    if (refund > 0) {
      await tx.client.update({
        where: { id: booking.clientId },
        data: { balance: { increment: refund } },
      });
      await tx.balanceTransaction.create({
        data: {
          clientId: booking.clientId,
          bookingId: booking.id,
          type: "BOOKING_REFUND",
          amount: refund,
          note: reason?.trim() || null,
        },
      });
    }
  });

  return { ok: true };
}
