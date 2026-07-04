import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { CalendarView } from "@/components/admin/calendar/calendar-view";
import { bookingInclude, toBookingDTO } from "@/lib/bookings/mappers";
import { toPlaceDTO } from "@/lib/places/mappers";
import { clubDayStart, formatDateInput } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : formatDateInput(new Date());

  const dayStart = clubDayStart(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);

  const [places, bookings, clients] = await Promise.all([
    prisma.place.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ room: { name: "asc" } }, { name: "asc" }],
      include: { category: true, room: true },
    }),
    prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      include: bookingInclude,
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Calendar" subtitle="Booking schedule across all places" />
      <CalendarView
        date={date}
        dayStartISO={dayStart.toISOString()}
        places={places.map(toPlaceDTO)}
        bookings={bookings.map(toBookingDTO)}
        clients={clients.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
      />
    </>
  );
}
