import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { freeWindowsForDay } from "@/lib/clubs/availability";
import { formatDateInput } from "@/lib/format";

export const dynamic = "force-dynamic";

const DAYS_AHEAD = 14;

function dateStrip(): string[] {
  const todayStr = formatDateInput(new Date());
  const base = new Date(`${todayStr}T12:00:00Z`);
  return Array.from({ length: DAYS_AHEAD }, (_, i) =>
    new Date(base.getTime() + i * 86_400_000).toISOString().slice(0, 10)
  );
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date: dateParam } = await searchParams;
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) notFound();

  const dates = dateStrip();
  const date =
    dateParam && dates.includes(dateParam) ? dateParam : dates[0];

  const intl = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  const fullDate = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const isActive = club.status === "ACTIVE";
  const availability = isActive ? await freeWindowsForDay(date) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/clubs" className="text-sm text-indigo-600 hover:underline">
        {t.clubs.backToClubs}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
          <p className="text-sm text-gray-500">
            {club.city}
            {club.address ? ` · ${club.address}` : ""}
            {club.rating !== null ? ` · ★ ${Number(club.rating).toFixed(1)}` : ""}
          </p>
        </div>
      </div>

      {!isActive ? (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="text-lg font-semibold text-gray-900">
            {t.clubs.comingSoonTitle}
          </div>
          <p className="mt-1 text-sm text-gray-500">{t.clubs.comingSoonText}</p>
        </div>
      ) : (
        <>
          {/* Airbnb-style date strip */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => {
              const dd = new Date(`${d}T12:00:00Z`);
              const active = d === date;
              return (
                <Link
                  key={d}
                  href={`/clubs/${club.slug}?date=${d}`}
                  className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 text-center ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                  }`}
                >
                  <span className="text-[11px] uppercase opacity-80">
                    {intl.format(dd)}
                  </span>
                  <span className="text-lg font-semibold leading-tight">
                    {dd.getUTCDate()}
                  </span>
                </Link>
              );
            })}
          </div>

          <h2 className="mt-6 text-base font-semibold text-gray-900">
            {t.clubs.availabilityFor} {fullDate.format(new Date(`${date}T12:00:00Z`))}
          </h2>

          <div className="mt-4 space-y-3">
            {availability.every((p) => p.windows.length === 0) ? (
              <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                {t.clubs.fullyBooked}. {t.clubs.pickAnotherDate}
              </p>
            ) : (
              availability
                .filter((p) => p.windows.length > 0)
                .map((p) => (
                  <div
                    key={p.placeId}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{p.placeName}</div>
                      <div className="text-xs text-gray-500">
                        {p.categoryName}
                        {p.roomName ? ` · ${p.roomName}` : ""}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="mr-1 self-center text-xs font-medium text-green-600">
                        {t.clubs.free}:
                      </span>
                      {p.windows.map((w, idx) => (
                        <Link
                          key={idx}
                          href={`/book?category=${p.categoryId}&date=${date}&time=${w.startTime}`}
                          className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
                        >
                          {w.startTime}–{w.endTime}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
