"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PlaceDTO, RoomDTO } from "@/lib/dto";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function BookingFilters({
  places,
  rooms,
}: {
  places: PlaceDTO[];
  rooms: RoomDTO[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/bookings?${params.toString()}`);
  };

  const hasFilters = ["date", "placeId", "roomId", "status"].some((k) =>
    searchParams.get(k)
  );

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Дата</label>
        <Input
          type="date"
          value={searchParams.get("date") ?? ""}
          onChange={(e) => setParam("date", e.target.value)}
          className="w-40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Место</label>
        <Select
          value={searchParams.get("placeId") ?? ""}
          onChange={(e) => setParam("placeId", e.target.value)}
          className="w-48"
        >
          <option value="">Все места</option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Комната</label>
        <Select
          value={searchParams.get("roomId") ?? ""}
          onChange={(e) => setParam("roomId", e.target.value)}
          className="w-44"
        >
          <option value="">Все комнаты</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Статус</label>
        <Select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
          className="w-40"
        >
          <option value="">Все</option>
          <option value="ACTIVE">Активные</option>
          <option value="CANCELLED">Отменённые</option>
        </Select>
      </div>
      {hasFilters ? (
        <Button variant="ghost" onClick={() => router.push("/admin/bookings")}>
          Сбросить
        </Button>
      ) : null}
    </div>
  );
}
