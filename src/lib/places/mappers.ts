import { PlaceDTO } from "@/lib/dto";
import { Prisma } from "@/generated/prisma/client";

export type PlaceWithRelations = Prisma.PlaceGetPayload<{
  include: { category: true; room: true };
}>;

export function toPlaceDTO(p: PlaceWithRelations): PlaceDTO {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    status: p.status,
    pricePerHour: Number(p.pricePerHour),
    categoryId: p.categoryId,
    categoryName: p.category.name,
    roomId: p.roomId,
    roomName: p.room?.name ?? null,
  };
}
