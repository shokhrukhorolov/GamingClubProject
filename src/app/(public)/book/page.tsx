import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/auth/require-client";
import { findAvailablePlaces } from "@/lib/bookings/public-availability";
import { calcTotalPrice } from "@/lib/bookings/availability";
import { toPlaceDTO } from "@/lib/places/mappers";
import { clubTimeToDate, formatDateInput, nowMs } from "@/lib/format";
import { SearchForm } from "@/components/site/book/search-form";
import { PlaceResults } from "@/components/site/book/place-results";

export const dynamic = "force-dynamic";

const DURATIONS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    date?: string;
    time?: string;
    duration?: string;
  }>;
}) {
  const clientId = await requireClientId();
  const params = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : formatDateInput(new Date());
  const time = params.time && /^\d{2}:\d{2}$/.test(params.time) ? params.time : "18:00";
  const duration = DURATIONS.includes(Number(params.duration))
    ? Number(params.duration)
    : 2;
  const categoryId =
    params.category && categories.some((c) => c.id === params.category)
      ? params.category
      : categories[0]?.id;

  const hasSearch = Boolean(params.category || params.date || params.time);

  let results: Awaited<ReturnType<typeof findAvailablePlaces>> = [];
  let searched = false;
  let startsAt: Date | null = null;

  if (hasSearch && categoryId) {
    startsAt = clubTimeToDate(date, time);
    const endsAt = new Date(startsAt.getTime() + duration * 3_600_000);
    results = await findAvailablePlaces(categoryId, startsAt, endsAt);
    searched = true;
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  const balance = Number(client?.balance ?? 0);

  const endsAt = startsAt
    ? new Date(startsAt.getTime() + duration * 3_600_000)
    : null;
  const totals = Object.fromEntries(
    results.map((p) => [
      p.id,
      startsAt && endsAt
        ? calcTotalPrice(Number(p.pricePerHour), startsAt, endsAt)
        : 0,
    ])
  );

  const inPast = startsAt ? startsAt.getTime() < nowMs() + 5 * 60_000 : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Book a seat</h1>
      <p className="mt-1 text-sm text-gray-500">
        Pick a category, date and time — we&apos;ll show what&apos;s free
      </p>

      <div className="mt-6">
        <SearchForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          defaults={{
            category: categoryId ?? "",
            date,
            time,
            duration: String(duration),
          }}
        />
      </div>

      <div className="mt-8">
        {!searched ? (
          <p className="text-center text-sm text-gray-400">
            Choose your slot above and hit Search
          </p>
        ) : inPast ? (
          <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            That time is in the past — pick a future slot.
          </p>
        ) : results.length === 0 ? (
          <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            No places free at that time. Try another time or category.
          </p>
        ) : (
          <PlaceResults
            places={results.map(toPlaceDTO)}
            params={{ date, time, duration }}
            totals={totals}
            balance={balance}
          />
        )}
      </div>
    </div>
  );
}
