import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { CategoriesManager } from "@/components/admin/categories/categories-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { places: true } } },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Pricing tiers: Standard, Premium, VIP"
      />
      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          defaultPricePerHour: Number(c.defaultPricePerHour),
          sortOrder: c.sortOrder,
          placesCount: c._count.places,
        }))}
      />
    </>
  );
}
