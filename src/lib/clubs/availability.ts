import { prisma } from "@/lib/prisma";
import { clubDayStart, formatTime } from "@/lib/format";
import { OPEN_HOUR, CLOSE_HOUR } from "@/lib/date/business-hours";

export type FreeWindow = { startTime: string; endTime: string; startMinute: number };
export type PlaceAvailability = {
  placeId: string;
  placeName: string;
  categoryId: string;
  categoryName: string;
  roomName: string | null;
  windows: FreeWindow[];
};

function subtractBusy(
  openMs: number,
  closeMs: number,
  intervals: { start: number; end: number }[]
): { start: number; end: number }[] {
  const busy = intervals
    .map((i) => ({ start: Math.max(i.start, openMs), end: Math.min(i.end, closeMs) }))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);

  const free: { start: number; end: number }[] = [];
  let cursor = openMs;
  for (const b of busy) {
    if (b.start > cursor) free.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < closeMs) free.push({ start: cursor, end: closeMs });
  return free;
}

/** Free time windows per active place for a club-local calendar day ("yyyy-MM-dd"). */
export async function freeWindowsForDay(
  dateStr: string
): Promise<PlaceAvailability[]> {
  const dayStart = clubDayStart(dateStr);
  const openMs = dayStart.getTime() + OPEN_HOUR * 3_600_000;
  const closeMs = dayStart.getTime() + CLOSE_HOUR * 3_600_000;
  const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);

  const [places, bookings] = await Promise.all([
    prisma.place.findMany({
      where: { status: "ACTIVE" },
      include: { category: true, room: true },
      orderBy: [{ room: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { placeId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const byPlace = new Map<string, { start: number; end: number }[]>();
  for (const b of bookings) {
    const list = byPlace.get(b.placeId) ?? [];
    list.push({ start: b.startsAt.getTime(), end: b.endsAt.getTime() });
    byPlace.set(b.placeId, list);
  }

  return places.map((p) => {
    const free = subtractBusy(openMs, closeMs, byPlace.get(p.id) ?? []);
    return {
      placeId: p.id,
      placeName: p.name,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      roomName: p.room?.name ?? null,
      windows: free.map((w) => ({
        startTime: formatTime(new Date(w.start)),
        endTime: w.end >= closeMs ? "24:00" : formatTime(new Date(w.end)),
        startMinute: Math.round((w.start - dayStart.getTime()) / 60_000),
      })),
    };
  });
}
