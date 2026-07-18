import { ClubDTO } from "@/lib/dto";
import { Club } from "@/generated/prisma/client";

export function toClubDTO(c: Club): ClubDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    city: c.city,
    address: c.address,
    description: c.description,
    imageUrl: c.imageUrl,
    rating: c.rating === null ? null : Number(c.rating),
    status: c.status,
    isMain: c.isMain,
    sortOrder: c.sortOrder,
  };
}
