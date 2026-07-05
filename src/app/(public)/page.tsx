import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Create an account",
    text: "Sign up with your phone number in under a minute.",
  },
  {
    title: "Top up your balance",
    text: "Add funds at the club desk. Online payment is coming soon.",
  },
  {
    title: "Book your seat",
    text: "Pick a category, date and time. Your seat is waiting.",
  },
];

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      places: {
        where: { status: "ACTIVE" },
        select: { pricePerHour: true },
      },
    },
  });

  return (
    <>
      {/* hero */}
      <section className="bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Game on your terms
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">
            Book a gaming seat or a private VIP room online. Choose your time,
            see the price upfront, and just show up and play.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/book"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Book now
            </Link>
            <a
              href="#categories"
              className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-800"
            >
              See prices
            </a>
          </div>
        </div>
      </section>

      {/* categories */}
      <section id="categories" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Choose your setup
        </h2>
        <p className="mt-2 text-center text-gray-500">
          Pay only for the time you play
        </p>

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
                    ? `${category.places.length} place${category.places.length === 1 ? "" : "s"} available`
                    : "Coming soon"}
                </p>
                <div className="mt-4 flex-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatMoney(fromPrice)}
                  </span>
                  <span className="text-sm text-gray-500"> / hour</span>
                </div>
                <Link
                  href={`/book?category=${category.id}`}
                  className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Book {category.name}
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
            How it works
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
