"use client";

import { useState, useTransition } from "react";
import { BookingDTO } from "@/lib/dto";
import { cancelClientBooking } from "@/lib/bookings/client-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FieldError } from "@/components/ui/input";
import { formatMoney, formatDateTime, formatTime } from "@/lib/format";
import { useT } from "@/lib/i18n/client";

function SnacksLine({ booking }: { booking: BookingDTO }) {
  if (booking.snacks.length === 0) return null;
  return (
    <div className="mt-1 text-xs text-gray-400">
      {booking.snacks.map((s) => `${s.name} ×${s.quantity}`).join(", ")}
    </div>
  );
}

function BookingRow({
  booking,
  labels,
  onCancel,
}: {
  booking: BookingDTO;
  labels: { active: string; cancelled: string; cancel: string };
  onCancel?: (b: BookingDTO) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <div className="font-medium text-gray-900">
          {booking.clubName ?? booking.placeName}
        </div>
        <div className="text-xs text-indigo-600">
          {booking.placeName}
          {booking.categoryName ? ` · ${booking.categoryName}` : ""}
        </div>
        <div className="text-sm text-gray-500">
          {formatDateTime(new Date(booking.startsAt))} –{" "}
          {formatTime(new Date(booking.endsAt))} · {formatMoney(booking.totalPrice)}
        </div>
        <SnacksLine booking={booking} />
      </div>
      <div className="flex items-center gap-2">
        {booking.status === "ACTIVE" ? (
          <Badge tone="green">{labels.active}</Badge>
        ) : (
          <Badge tone="red">{labels.cancelled}</Badge>
        )}
        {onCancel ? (
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
            onClick={() => onCancel(booking)}
          >
            {labels.cancel}
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
  const t = useT();
  const [cancelling, setCancelling] = useState<BookingDTO | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const labels = {
    active: t.account.active,
    cancelled: t.account.cancelled,
    cancel: t.account.cancel,
  };

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
      <h2 className="text-base font-semibold text-gray-900">{t.account.myBookings}</h2>

      <h3 className="mt-4 text-sm font-medium text-gray-500">{t.account.upcoming}</h3>
      {upcoming.length === 0 ? (
        <p className="mt-1 text-sm text-gray-400">{t.account.noUpcoming}</p>
      ) : (
        <ul className="mt-1 divide-y divide-gray-100">
          {upcoming.map((b) => (
            <BookingRow key={b.id} booking={b} labels={labels} onCancel={setCancelling} />
          ))}
        </ul>
      )}

      {past.length > 0 ? (
        <>
          <h3 className="mt-6 text-sm font-medium text-gray-500">
            {t.account.pastCancelled}
          </h3>
          <ul className="mt-1 divide-y divide-gray-100">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} labels={labels} />
            ))}
          </ul>
        </>
      ) : null}

      <Modal open={cancelling !== null} onClose={close} title={t.account.cancelTitle}>
        {cancelling ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {cancelling.placeName}, {formatDateTime(new Date(cancelling.startsAt))}
            </p>
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {t.account.cancelNote}
            </p>
            <FieldError message={error} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                {t.account.keepBooking}
              </Button>
              <Button variant="danger" onClick={confirmCancel} disabled={pending}>
                {pending ? t.account.cancelling : t.account.cancelBooking}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
