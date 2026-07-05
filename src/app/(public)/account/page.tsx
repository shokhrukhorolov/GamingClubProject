import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/auth/require-client";
import { bookingInclude, toBookingDTO } from "@/lib/bookings/mappers";
import { nowMs } from "@/lib/format";
import { ProfileCard } from "@/components/site/account/profile-card";
import { BalanceCard } from "@/components/site/account/balance-card";
import { MyBookings } from "@/components/site/account/my-bookings";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const now = nowMs();
  const clientId = await requireClientId();

  const [client, bookings, transactions] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.booking.findMany({
      where: { clientId },
      orderBy: { startsAt: "desc" },
      include: bookingInclude,
      take: 50,
    }),
    prisma.balanceTransaction.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
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
      <h1 className="text-2xl font-bold text-gray-900">My account</h1>

      <ProfileCard
        profile={{ name: client.name, phone: client.phone, email: client.email }}
      />

      <BalanceCard
        balance={Number(client.balance)}
        transactions={transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          note: t.note,
          createdAt: t.createdAt.toISOString(),
        }))}
      />

      <MyBookings upcoming={upcoming} past={past} />
    </div>
  );
}
