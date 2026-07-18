"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlaceDTO, SnackDTO } from "@/lib/dto";
import { createClientBooking } from "@/lib/bookings/client-actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FieldError } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n/client";
import {
  SnacksPicker,
  SnackSelection,
  snacksSubtotal,
  selectionToPayload,
} from "./snacks-picker";

export function PlaceResults({
  places,
  params,
  totals,
  snacks,
}: {
  places: PlaceDTO[];
  params: { date: string; time: string; duration: number };
  totals: Record<string, number>;
  snacks: SnackDTO[];
}) {
  const t = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<PlaceDTO | null>(null);
  const [snackSel, setSnackSel] = useState<SnackSelection>({});
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const open = (place: PlaceDTO) => {
    setSelected(place);
    setSnackSel({});
    setError(undefined);
    setSuccess(false);
  };

  const close = () => {
    setSelected(null);
    setError(undefined);
    setSuccess(false);
  };

  const confirm = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await createClientBooking({
        placeId: selected.id,
        date: params.date,
        time: params.time,
        durationHours: params.duration,
        snacks: selectionToPayload(snackSel),
      });
      if (result.ok) {
        setSuccess(true);
        setError(undefined);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const total = selected ? totals[selected.id] : 0;
  const snacksTotal = snacksSubtotal(snacks, snackSel);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <div
            key={place.id}
            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{place.name}</h3>
              <p className="mt-0.5 text-sm text-gray-500">
                {place.categoryName}
                {place.roomName ? ` · ${place.roomName}` : ""}
              </p>
              <p className="mt-3 text-sm text-gray-500">
                {formatMoney(place.pricePerHour)}
                {t.common.perHour} ·{" "}
                <span className="font-semibold text-gray-900">
                  {formatMoney(totals[place.id])}
                </span>{" "}
                {t.book.forHours} {params.duration}
                {t.common.hours.toLowerCase() === "часов" ? " ч" : "h"}
              </p>
            </div>
            <Button onClick={() => open(place)} className="mt-4">
              {t.book.book}
            </Button>
          </div>
        ))}
      </div>

      <Modal
        open={selected !== null}
        onClose={close}
        title={success ? t.book.bookingConfirmed : t.book.confirmBooking}
      >
        {selected && !success ? (
          <div className="space-y-4">
            <div className="space-y-1.5 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t.book.place}</span>
                <span className="font-medium text-gray-900">
                  {selected.name}
                  {selected.roomName ? ` (${selected.roomName})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.book.dateTime}</span>
                <span className="font-medium text-gray-900">
                  {params.date}, {params.time} · {params.duration}
                  {t.common.hours.toLowerCase() === "часов" ? " ч" : "h"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.book.total}</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(total + snacksTotal)}
                </span>
              </div>
              {snacksTotal > 0 ? (
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{t.book.snacksSubtotal}</span>
                  <span>{formatMoney(snacksTotal)}</span>
                </div>
              ) : null}
            </div>

            <SnacksPicker snacks={snacks} selection={snackSel} onChange={setSnackSel} />

            <p className="rounded-lg bg-indigo-50 px-4 py-2.5 text-center text-sm text-indigo-800">
              {t.book.payAtClub}
            </p>

            <FieldError message={error} />

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                {t.common.cancel}
              </Button>
              <Button onClick={confirm} disabled={pending}>
                {pending ? "..." : t.book.book}
              </Button>
            </div>
          </div>
        ) : null}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">{t.book.confirmedText}</p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={close}>
                {t.book.bookAnother}
              </Button>
              <Link
                href="/account"
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {t.book.myBookings}
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
