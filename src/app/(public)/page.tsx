import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getDictionary();

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      places: {
        where: { status: "ACTIVE" },
        select: { pricePerHour: true },
      },
    },
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
              href="/book"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {t.home.bookNow}
            </Link>
            <a
              href="#categories"
              className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-800"
            >
              {t.home.seePrices}
            </a>
          </div>
        </div>
      </section>

      {/* categories */}
      <section id="categories" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          {t.home.chooseSetup}
        </h2>
        <p className="mt-2 text-center text-gray-500">{t.home.payOnlyForTime}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const prices = category.places.map((p) => Number(p.pricePerHour));
            const fromPrice =
              prices.length > 0
                ? Math.min(...prices)
                : Number(category.defaultPricePerHour);
            return (
              <div
                key={category.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {category.places.length > 0
                    ? `${category.places.length} ${
                        category.places.length === 1
                          ? t.home.onePlaceAvailable
                          : t.home.placesAvailable
                      }`
                    : t.common.comingSoon}
                </p>
                <div className="mt-4 flex-1">
                  <span className="text-sm text-gray-500">{t.common.from} </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatMoney(fromPrice)}
                  </span>
                  <span className="text-sm text-gray-500">{t.common.perHour}</span>
                </div>
                <Link
                  href={`/book?category=${category.id}`}
                  className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-500"
                >
                  {t.home.bookNow}
                </Link>
              </div>
            );
          })}
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
