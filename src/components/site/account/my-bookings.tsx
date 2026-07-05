"use client";

import { useState, useTransition } from "react";
import { BookingDTO } from "@/lib/dto";
import { cancelClientBooking } from "@/lib/bookings/client-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FieldError } from "@/components/ui/input";
import { formatMoney, formatDateTime, formatTime } from "@/lib/format";

function BookingRow({
  booking,
  onCancel,
}: {
  booking: BookingDTO;
  onCancel?: (b: BookingDTO) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <div className="font-medium text-gray-900">
          {booking.placeName}
          {booking.roomName ? ` (${booking.roomName})` : ""}
        </div>
        <div className="text-sm text-gray-500">
          {formatDateTime(new Date(booking.startsAt))} –{" "}
          {formatTime(new Date(booking.endsAt))} · {formatMoney(booking.totalPrice)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {booking.status === "ACTIVE" ? (
          <Badge tone="green">Active</Badge>
        ) : (
          <Badge tone="red">Cancelled</Badge>
        )}
        {onCancel ? (
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
            onClick={() => onCancel(booking)}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function MyBookings({
  upcoming,
  past,
}: {
  upcoming: BookingDTO[];
  past: BookingDTO[];
}) {
  const [cancelling, setCancelling] = useState<BookingDTO | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setCancelling(null);
    setError(undefined);
  };

  const confirmCancel = () => {
    if (!cancelling) return;
    startTransition(async () => {
      const result = await cancelClientBooking(cancelling.id);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">My bookings</h2>

      <h3 className="mt-4 text-sm font-medium text-gray-500">Upcoming</h3>
      {upcoming.length === 0 ? (
        <p className="mt-1 text-sm text-gray-400">
          No upcoming bookings — time to fix that!
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-gray-100">
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} onCancel={setCancelling} />
          ))}
        </ul>
      )}

      {past.length > 0 ? (
        <>
          <h3 className="mt-6 text-sm font-medium text-gray-500">
            Past & cancelled
          </h3>
          <ul className="mt-1 divide-y divide-gray-100">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        </>
      ) : null}

      <Modal open={cancelling !== null} onClose={close} title="Cancel booking?">
        {cancelling ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {cancelling.placeName},{" "}
              {formatDateTime(new Date(cancelling.startsAt))}
            </p>
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              The full amount ({formatMoney(cancelling.totalPrice)}) will be
              refunded to your balance.
            </p>
            <FieldError message={error} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                Keep booking
              </Button>
              <Button variant="danger" onClick={confirmCancel} disabled={pending}>
                {pending ? "Cancelling..." : "Cancel booking"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
