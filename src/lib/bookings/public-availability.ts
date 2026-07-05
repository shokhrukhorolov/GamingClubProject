import { prisma } from "@/lib/prisma";

/**
 * All ACTIVE places in a category with no ACTIVE booking overlapping the range.
 * Same overlap predicate as findConflict: startA < endB AND endA > startB.
 */
export async function findAvailablePlaces(
  categoryId: string,
  startsAt: Date,
  endsAt: Date
) {
  return prisma.place.findMany({
    where: {
      categoryId,
      status: "ACTIVE",
      bookings: {
        none: {
          status: "ACTIVE",
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      },
    },
    include: { room: true, category: true },
    orderBy: { name: "asc" },
  });
}
