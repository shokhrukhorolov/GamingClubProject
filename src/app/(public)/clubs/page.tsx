import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const GRADIENTS = [
  "from-violet-500 to-fuchsia-600",
  "from-indigo-500 to-sky-500",
  "from-fuchsia-500 to-rose-500",
  "from-emerald-500 to-teal-600",
];

export default async function ClubsPage() {
  const t = await getDictionary();
  const clubs = await prisma.club.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t.clubs.title}</h1>
      <p className="mt-1 text-gray-500">{t.clubs.subtitle}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club, i) => {
          const active = club.status === "ACTIVE";
          const inner = (
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div
                className={`relative h-36 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}
              >
                <span className="absolute left-3 top-3 rounded-md bg-black/30 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                  {club.city}
                </span>
                {!active ? (
                  <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {t.common.comingSoon}
                  </span>
                ) : club.rating !== null ? (
                  <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    ★ {Number(club.rating).toFixed(1)}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-gray-900">{club.name}</h3>
                {club.address ? (
                  <p className="mt-0.5 text-sm text-gray-500">{club.address}</p>
                ) : null}
                {club.description ? (
                  <p className="mt-2 flex-1 text-sm text-gray-500">{club.description}</p>
                ) : (
                  <div className="flex-1" />
                )}
                <span
                  className={`mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {active ? t.clubs.viewAvailability : t.common.comingSoon}
                </span>
              </div>
            </div>
          );

          return active ? (
            <Link key={club.id} href={`/clubs/${club.slug}`}>
              {inner}
            </Link>
          ) : (
            <div key={club.id} className="cursor-default opacity-90">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
