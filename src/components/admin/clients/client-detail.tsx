"use client";

import { useState } from "react";
import { BookingDTO } from "@/lib/dto";
import { Button } from "@/components/ui/button";
import { BookingsTable } from "@/components/admin/bookings/bookings-table";
import { ClientFormModal } from "./client-form-modal";
import { formatDate } from "@/lib/format";

export function ClientDetail({
  client,
  bookings,
}: {
  client: { id: string; name: string; phone: string; createdAt: string };
  bookings: BookingDTO[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <div className="text-lg font-semibold text-gray-900">{client.name}</div>
          <div className="text-sm text-gray-500">
            {client.phone} · клиент с {formatDate(new Date(client.createdAt))}
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Изменить
        </Button>
      </div>

      <h2 className="mb-3 text-base font-semibold text-gray-900">История броней</h2>
      <BookingsTable bookings={bookings} showClient={false} />

      <ClientFormModal open={editing} onClose={() => setEditing(false)} client={client} />
    </>
  );
}
