"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlaceDTO } from "@/lib/dto";
import { createClientBooking } from "@/lib/bookings/client-actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FieldError } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";

export function PlaceResults({
  places,
  params,
  totals,
  balance,
}: {
  places: PlaceDTO[];
  params: { date: string; time: string; duration: number };
  totals: Record<string, number>;
  balance: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlaceDTO | null>(null);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

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
  const insufficient = selected ? balance < total : false;

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
                {formatMoney(place.pricePerHour)}/hour ·{" "}
                <span className="font-semibold text-gray-900">
                  {formatMoney(totals[place.id])}
                </span>{" "}
                for {params.duration}h
              </p>
            </div>
            <Button onClick={() => setSelected(place)} className="mt-4">
              Book
            </Button>
          </div>
        ))}
      </div>

      <Modal
        open={selected !== null}
        onClose={close}
        title={success ? "Booking confirmed!" : "Confirm booking"}
      >
        {selected && !success ? (
          <div className="space-y-4">
            <div className="space-y-1.5 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Place</span>
                <span className="font-medium text-gray-900">
                  {selected.name}
                  {selected.roomName ? ` (${selected.roomName})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date & time</span>
                <span className="font-medium text-gray-900">
                  {params.date}, {params.time} · {params.duration}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Your balance</span>
                <span
                  className={`font-medium ${insufficient ? "text-red-600" : "text-gray-900"}`}
                >
                  {formatMoney(balance)}
                </span>
              </div>
            </div>

            {insufficient ? (
              <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                Not enough balance for this booking.{" "}
                <Link href="/account" className="font-medium underline">
                  Top up on your account page
                </Link>
                .
              </p>
            ) : null}

            <FieldError message={error} />

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button onClick={confirm} disabled={pending || insufficient}>
                {pending ? "Booking..." : `Pay ${formatMoney(total)} & book`}
              </Button>
            </div>
          </div>
        ) : null}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Your seat is booked. See you at the club!
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={close}>
                Book another
              </Button>
              <Link
                href="/account"
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                My bookings
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
