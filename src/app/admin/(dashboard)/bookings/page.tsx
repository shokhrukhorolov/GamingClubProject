import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { BookingsPageClient } from "@/components/admin/bookings/bookings-page-client";
import { bookingInclude, toBookingDTO } from "@/lib/bookings/mappers";
import { toPlaceDTO } from "@/lib/places/mappers";
import { clubDayStart } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    placeId?: string;
    roomId?: string;
    status?: string;
  }>;
}) {
  const { date, placeId, roomId, status } = await searchParams;

  const where: Prisma.BookingWhereInput = {};
  if (placeId) where.placeId = placeId;
  if (roomId) where.place = { roomId };
  if (status === "ACTIVE" || status === "CANCELLED") where.status = status;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const dayStart = clubDayStart(date);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);
    // any booking that touches this day
    where.startsAt = { lt: dayEnd };
    where.endsAt = { gt: dayStart };
  }

  const [bookings, places, rooms, clients] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: bookingInclude,
      take: 200,
    }),
    prisma.place.findMany({
      orderBy: { name: "asc" },
      include: { category: true, room: true },
    }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Bookings" subtitle="All club bookings with filters" />
      <BookingsPageClient
        bookings={bookings.map(toBookingDTO)}
        places={places.map(toPlaceDTO)}
        rooms={rooms.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          placesCount: 0,
        }))}
        clients={clients.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
      />
    </>
  );
}
