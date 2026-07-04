import { prisma } from "@/lib/prisma";

/**
 * Returns the conflicting booking (if any) for the given place and time range.
 * Two ranges overlap when startA < endB AND endA > startB.
 */
export async function findConflict(
  placeId: string,
  startsAt: Date,
  endsAt: Date,
  excludeBookingId?: string
) {
  return prisma.booking.findFirst({
    where: {
      placeId,
      status: "ACTIVE",
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: { client: true },
  });
}

export function calcTotalPrice(pricePerHour: number, startsAt: Date, endsAt: Date): number {
  const hours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;
  return Math.round(pricePerHour * hours * 100) / 100;
}
