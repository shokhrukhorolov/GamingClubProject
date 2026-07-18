import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { SnacksManager } from "@/components/admin/snacks/snacks-manager";

export const dynamic = "force-dynamic";

export default async function SnacksPage() {
  const snacks = await prisma.snack.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader title="Snacks" subtitle="Drinks & snacks clients can add to a booking" />
      <SnacksManager
        snacks={snacks.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: Number(s.price),
          isAvailable: s.isAvailable,
          sortOrder: s.sortOrder,
        }))}
      />
    </>
  );
}
