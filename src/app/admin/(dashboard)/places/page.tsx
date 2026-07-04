import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { PlacesManager } from "@/components/admin/places/places-manager";

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const [places, categories, rooms] = await Promise.all([
    prisma.place.findMany({
      orderBy: [{ room: { name: "asc" } }, { name: "asc" }],
      include: { category: true, room: true },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Места"
        subtitle="Все бронируемые места и комнаты клуба"
      />
      <PlacesManager
        places={places.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          status: p.status,
          pricePerHour: Number(p.pricePerHour),
          categoryId: p.categoryId,
          categoryName: p.category.name,
          roomId: p.roomId,
          roomName: p.room?.name ?? null,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          defaultPricePerHour: Number(c.defaultPricePerHour),
          sortOrder: c.sortOrder,
          placesCount: 0,
        }))}
        rooms={rooms.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          placesCount: 0,
        }))}
      />
    </>
  );
}
