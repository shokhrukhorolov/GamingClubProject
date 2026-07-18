import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";
import { getClientId } from "@/lib/auth/require-client";
import { nowMs } from "@/lib/format";
import { BookingFlow, FlowPlace } from "@/components/site/booking/booking-flow";

export const dynamic = "force-dynamic";

/** "Standard 3" -> "3"; falls back to the full name. */
function seatNumber(name: string): string {
  const m = name.match(/(\d+)\s*$/);
  return m ? m[1] : name;
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getDictionary();

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) notFound();

  const isActive = club.status === "ACTIVE";
  const clientId = await getClientId();

  if (!isActive) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/clubs" className="text-sm text-indigo-600 hover:underline">
          {t.clubs.backToClubs}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">{club.name}</h1>
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="text-lg font-semibold text-gray-900">
            {t.clubs.comingSoonTitle}
          </div>
          <p className="mt-1 text-sm text-gray-500">{t.clubs.comingSoonText}</p>
        </div>
      </div>
    );
  }

  const now = nowMs();
  const windowEnd = new Date(now + 31 * 86_400_000);
  const [places, busy, snacks] = await Promise.all([
    prisma.place.findMany({
      where: { clubId: club.id, status: "ACTIVE" },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        endsAt: { gt: new Date(now) },
        startsAt: { lt: windowEnd },
        place: { clubId: club.id },
      },
      select: { placeId: true, startsAt: true, endsAt: true },
    }),
    prisma.snack.findMany({
      where: { isAvailable: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const flowPlaces: FlowPlace[] = places.map((p) => ({
    id: p.id,
    name: p.name,
    seatNo: seatNumber(p.name),
    categoryId: p.categoryId,
    categoryName: p.category.name,
    pricePerHour: Number(p.pricePerHour),
  }));

  // only tiers that actually have seats in this club
  const categories = Array.from(
    new Map(flowPlaces.map((p) => [p.categoryId, p.categoryName])).entries()
  ).map(([id, name]) => ({ id, name }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/clubs" className="text-sm text-indigo-600 hover:underline">
        {t.clubs.backToClubs}
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
        <p className="text-sm text-gray-500">
          {club.city}
          {club.address ? ` · ${club.address}` : ""}
          {club.rating !== null ? ` · ★ ${Number(club.rating).toFixed(1)}` : ""}
        </p>
      </div>

      <h2 className="mt-8 mb-4 text-lg font-semibold text-gray-900">{t.flow.title}</h2>

      {clientId ? (
        <BookingFlow
          clubName={club.name}
          places={flowPlaces}
          categories={categories}
          busy={busy.map((b) => ({
            placeId: b.placeId,
            startsAt: b.startsAt.toISOString(),
            endsAt: b.endsAt.toISOString(),
          }))}
          snacks={snacks.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: Number(s.price),
            isAvailable: s.isAvailable,
            sortOrder: s.sortOrder,
          }))}
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">{t.auth.bookOnline}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(`/clubs/${club.slug}`)}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t.auth.signIn}
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(`/clubs/${club.slug}`)}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {t.auth.signUp}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
