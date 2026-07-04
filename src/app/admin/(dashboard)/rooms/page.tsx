import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { RoomsManager } from "@/components/admin/rooms/rooms-manager";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { places: true } } },
  });

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Physical zones of the club that contain places"
      />
      <RoomsManager
        rooms={rooms.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          placesCount: r._count.places,
        }))}
      />
    </>
  );
}
