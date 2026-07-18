import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/auth/require-client";
import { bookingInclude, toBookingDTO } from "@/lib/bookings/mappers";
import { nowMs } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { ProfileCard } from "@/components/site/account/profile-card";
import { MyBookings } from "@/components/site/account/my-bookings";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const now = nowMs();
  const clientId = await requireClientId();
  const t = await getDictionary();

  const [client, bookings] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.booking.findMany({
      where: { clientId },
      orderBy: { startsAt: "desc" },
      include: bookingInclude,
      take: 50,
    }),
  ]);

  if (!client) notFound();

  const dtos = bookings.map(toBookingDTO);
  const upcoming = dtos.filter(
    (b) => b.status === "ACTIVE" && new Date(b.endsAt).getTime() > now
  );
  const past = dtos.filter(
    (b) => !(b.status === "ACTIVE" && new Date(b.endsAt).getTime() > now)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.account.title}</h1>

      <ProfileCard
        profile={{ name: client.name, phone: client.phone, email: client.email }}
      />

      <MyBookings upcoming={upcoming} past={past} />
    </div>
  );
}
