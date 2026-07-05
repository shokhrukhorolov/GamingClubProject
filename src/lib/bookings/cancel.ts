import { prisma } from "@/lib/prisma";

export type CancelOutcome =
  | { ok: true }
  | { ok: false; error: "not_found" | "already_cancelled" };

/**
 * Cancels a booking. CLIENT-sourced bookings were paid from the client's
 * balance, so cancelling refunds the full amount (MVP policy) and writes a
 * BOOKING_REFUND ledger row. ADMIN-sourced bookings never touched the balance
 * (paid at the desk), so they are just flipped to CANCELLED.
 */
export async function cancelBookingWithRefund(
  bookingId: string,
  reason?: string
): Promise<CancelOutcome> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "not_found" };
  if (booking.status === "CANCELLED") return { ok: false, error: "already_cancelled" };

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason?.trim() || null,
      },
    });

    if (booking.source === "CLIENT") {
      const refund = Number(booking.totalPrice);
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
