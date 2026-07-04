import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ClientDetail } from "@/components/admin/clients/client-detail";
import { bookingInclude, toBookingDTO } from "@/lib/bookings/mappers";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { startsAt: "desc" },
        include: bookingInclude,
      },
    },
  });

  if (!client) notFound();

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/clients" className="text-sm text-indigo-600 hover:underline">
          ← All clients
        </Link>
      </div>
      <ClientDetail
        client={{
          id: client.id,
          name: client.name,
          phone: client.phone,
          createdAt: client.createdAt.toISOString(),
        }}
        bookings={client.bookings.map(toBookingDTO)}
      />
    </>
  );
}
