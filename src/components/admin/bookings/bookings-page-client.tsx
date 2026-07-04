"use client";

import { useState } from "react";
import { BookingDTO, PlaceDTO, RoomDTO } from "@/lib/dto";
import { Button } from "@/components/ui/button";
import { BookingFilters } from "./booking-filters";
import { BookingsTable } from "./bookings-table";
import { BookingFormModal, ClientOption } from "./booking-form-modal";

export function BookingsPageClient({
  bookings,
  places,
  rooms,
  clients,
}: {
  bookings: BookingDTO[];
  places: PlaceDTO[];
  rooms: RoomDTO[];
  clients: ClientOption[];
}) {
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-4">
        <BookingFilters places={places} rooms={rooms} />
        <Button onClick={() => setCreating(true)} className="shrink-0">
          + Новая бронь
        </Button>
      </div>

      <BookingsTable bookings={bookings} />

      <BookingFormModal
        open={creating}
        onClose={() => setCreating(false)}
        places={places}
        clients={clients}
      />
    </>
  );
}
