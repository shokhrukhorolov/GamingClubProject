import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const CLUB_GRADIENTS = [
  "from-violet-500 to-fuchsia-600",
  "from-indigo-500 to-sky-500",
  "from-fuchsia-500 to-rose-500",
];

export default async function HomePage() {
  const t = await getDictionary();

  const clubs = await prisma.club.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 3,
  });

  const steps = [
    { title: t.home.step1Title, text: t.home.step1Text },
    { title: t.home.step2Title, text: t.home.step2Text },
    { title: t.home.step3Title, text: t.home.step3Text },
  ];

  return (
    <>
      {/* hero */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t.home.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">
            {t.home.heroSubtitle}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/clubs"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {t.home.bookNow}
            </Link>
            <a
              href="#clubs"
              className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-800"
            >
              {t.home.seePrices}
            </a>
          </div>
        </div>
      </section>

      {/* clubs we work with */}
      <section id="clubs" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          {t.home.chooseSetup}
        </h2>
        <p className="mt-2 text-center text-gray-500">{t.home.payOnlyForTime}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club, i) => {
            const active = club.status === "ACTIVE";
            const card = (
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div
                  className={`relative h-36 bg-gradient-to-br ${CLUB_GRADIENTS[i % CLUB_GRADIENTS.length]}`}
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
                      active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {active ? t.clubs.book : t.common.comingSoon}
                  </span>
                </div>
              </div>
            );
            return active ? (
              <Link key={club.id} href={`/clubs/${club.slug}`}>
                {card}
              </Link>
            ) : (
              <div key={club.id} className="opacity-90">
                {card}
              </div>
            );
          })}
        </div>

        {/* CTA to booking */}
        <div className="mt-10 text-center">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {t.clubs.book} →
          </Link>
        </div>
      </section>

      {/* how it works */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            {t.home.howItWorks}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
