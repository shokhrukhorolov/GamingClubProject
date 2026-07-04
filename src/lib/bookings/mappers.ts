import { BookingDTO } from "@/lib/dto";
import { Prisma } from "@/generated/prisma/client";

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { place: { include: { category: true; room: true } }; client: true };
}>;

export const bookingInclude = {
  place: { include: { category: true, room: true } },
  client: true,
} as const;

export function toBookingDTO(b: BookingWithRelations): BookingDTO {
  return {
    id: b.id,
    placeId: b.placeId,
    placeName: b.place.name,
    roomName: b.place.room?.name ?? null,
    categoryName: b.place.category.name,
    clientId: b.clientId,
    clientName: b.client.name,
    clientPhone: b.client.phone,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    totalPrice: Number(b.totalPrice),
    status: b.status,
    source: b.source,
    cancelReason: b.cancelReason,
  };
}
