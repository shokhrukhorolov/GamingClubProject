import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { ClientsList } from "@/components/admin/clients/clients-list";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <>
      <PageHeader title="Клиенты" subtitle="Все клиенты клуба и их брони" />
      <ClientsList
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          bookingsCount: c._count.bookings,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
