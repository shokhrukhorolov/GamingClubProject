"use client";

import { useState } from "react";
import { BookingDTO, BalanceTransactionDTO } from "@/lib/dto";
import { Button } from "@/components/ui/button";
import { BookingsTable } from "@/components/admin/bookings/bookings-table";
import { ClientFormModal } from "./client-form-modal";
import { BalanceAdjustModal } from "./balance-adjust-modal";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

const txLabels: Record<BalanceTransactionDTO["type"], string> = {
  TOPUP_ADMIN: "Manual adjustment",
  BOOKING_CHARGE: "Booking payment",
  BOOKING_REFUND: "Refund",
};

export function ClientDetail({
  client,
  bookings,
  balance,
  transactions,
}: {
  client: { id: string; name: string; phone: string; createdAt: string };
  bookings: BookingDTO[];
  balance: number;
  transactions: BalanceTransactionDTO[];
}) {
  const [editing, setEditing] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <div className="text-lg font-semibold text-gray-900">{client.name}</div>
          <div className="text-sm text-gray-500">
            {client.phone} · client since {formatDate(new Date(client.createdAt))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatMoney(balance)}
            </div>
          </div>
          <Button onClick={() => setAdjusting(true)}>Adjust balance</Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      <h2 className="mb-3 text-base font-semibold text-gray-900">Booking history</h2>
      <BookingsTable bookings={bookings} showClient={false} />

      <h2 className="mb-3 mt-8 text-base font-semibold text-gray-900">
        Balance history
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white">
        {transactions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            No transactions yet
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="font-medium text-gray-900">{txLabels[t.type]}</div>
                  <div className="text-xs text-gray-400">
                    {formatDateTime(new Date(t.createdAt))}
                    {t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>
                <span
                  className={`font-semibold ${t.amount >= 0 ? "text-green-600" : "text-gray-900"}`}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {formatMoney(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ClientFormModal open={editing} onClose={() => setEditing(false)} client={client} />
      <BalanceAdjustModal
        open={adjusting}
        onClose={() => setAdjusting(false)}
        clientId={client.id}
        clientName={client.name}
      />
    </>
  );
}
