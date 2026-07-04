"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookingDTO, PlaceDTO } from "@/lib/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Textarea, Label, FieldError } from "@/components/ui/input";
import {
  BookingFormModal,
  ClientOption,
  BookingPrefill,
} from "@/components/admin/bookings/booking-form-modal";
import { cancelBooking } from "@/lib/bookings/actions";
import { formatMoney, formatDateTime, formatTime } from "@/lib/format";

const HOUR_PX = 44;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type Props = {
  date: string; // yyyy-MM-dd (club-local day)
  dayStartISO: string; // absolute instant of the club-local day start
  places: PlaceDTO[];
  bookings: BookingDTO[];
  clients: ClientOption[];
};

export function CalendarView({ date, dayStartISO, places, bookings, clients }: Props) {
  const router = useRouter();
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null);
  const [selected, setSelected] = useState<BookingDTO | null>(null);
  const [cancelError, setCancelError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const dayStart = useMemo(() => new Date(dayStartISO).getTime(), [dayStartISO]);

  const bookingsByPlace = useMemo(() => {
    const map = new Map<string, BookingDTO[]>();
    for (const booking of bookings) {
      const list = map.get(booking.placeId) ?? [];
      list.push(booking);
      map.set(booking.placeId, list);
    }
    return map;
  }, [bookings]);

  const goToDay = (offset: number) => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + offset);
    router.push(`/admin/calendar?date=${d.toISOString().slice(0, 10)}`);
  };

  const onColumnClick = (placeId: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.floor(y / HOUR_PX);
    setPrefill({
      placeId,
      date,
      time: `${String(Math.min(23, Math.max(0, hour))).padStart(2, "0")}:00`,
    });
  };

  const submitCancel = (formData: FormData) => {
    if (!selected) return;
    const reason = String(formData.get("reason") ?? "");
    startTransition(async () => {
      const result = await cancelBooking(selected.id, reason);
      if (result.ok) {
        setSelected(null);
        setCancelError(undefined);
      } else {
        setCancelError(result.error);
      }
    });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => goToDay(-1)}>
          ←
        </Button>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) router.push(`/admin/calendar?date=${e.target.value}`);
          }}
          className="w-44"
        />
        <Button variant="secondary" onClick={() => goToDay(1)}>
          →
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/calendar")}
        >
          Сегодня
        </Button>
        <div className="ml-auto text-sm text-gray-500">
          Клик по свободной ячейке — новая бронь
        </div>
      </div>

      {places.length === 0 ? (
        <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Нет активных мест. Добавьте места в разделе «Места».
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <div className="flex" style={{ minWidth: 64 + places.length * 140 }}>
            {/* time gutter */}
            <div className="w-16 shrink-0 border-r border-gray-200">
              <div className="h-12 border-b border-gray-200" />
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="relative border-b border-gray-100 text-right"
                  style={{ height: HOUR_PX }}
                >
                  <span className="absolute -top-2 right-2 text-xs text-gray-400">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* place columns */}
            {places.map((place) => {
              const placeBookings = bookingsByPlace.get(place.id) ?? [];
              return (
                <div
                  key={place.id}
                  className="min-w-[140px] flex-1 border-r border-gray-100 last:border-r-0"
                >
                  <div className="flex h-12 flex-col items-center justify-center border-b border-gray-200 bg-gray-50 px-2">
                    <div className="max-w-full truncate text-sm font-medium text-gray-900">
                      {place.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {place.categoryName}
                      {place.roomName ? ` · ${place.roomName}` : ""}
                    </div>
                  </div>
                  <div
                    className="relative cursor-crosshair"
                    style={{ height: 24 * HOUR_PX }}
                    onClick={(e) => onColumnClick(place.id, e)}
                  >
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="absolute inset-x-0 border-b border-gray-100"
                        style={{ top: (h + 1) * HOUR_PX - 1 }}
                      />
                    ))}
                    {placeBookings.map((booking) => {
                      const startMs = new Date(booking.startsAt).getTime();
                      const endMs = new Date(booking.endsAt).getTime();
                      const topHours = Math.max(0, (startMs - dayStart) / 3_600_000);
                      const endHours = Math.min(24, (endMs - dayStart) / 3_600_000);
                      const height = Math.max(0.4, endHours - topHours) * HOUR_PX;
                      return (
                        <button
                          key={booking.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(booking);
                          }}
                          className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border border-indigo-300 bg-indigo-100 px-2 py-1 text-left transition-colors hover:bg-indigo-200 cursor-pointer"
                          style={{ top: topHours * HOUR_PX + 1, height: height - 2 }}
                        >
                          <div className="truncate text-xs font-semibold text-indigo-900">
                            {booking.clientName}
                          </div>
                          <div className="truncate text-xs text-indigo-700">
                            {formatTime(new Date(booking.startsAt))}–
                            {formatTime(new Date(booking.endsAt))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BookingFormModal
        open={prefill !== null}
        onClose={() => setPrefill(null)}
        places={places}
        clients={clients}
        prefill={prefill ?? undefined}
      />

      <Modal
        open={selected !== null}
        onClose={() => {
          setSelected(null);
          setCancelError(undefined);
        }}
        title="Бронь"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Место</span>
                <span className="font-medium text-gray-900">
                  {selected.placeName}
                  {selected.roomName ? ` (${selected.roomName})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Клиент</span>
                <span className="font-medium text-gray-900">
                  {selected.clientName} · {selected.clientPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Время</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(new Date(selected.startsAt))} —{" "}
                  {formatTime(new Date(selected.endsAt))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Стоимость</span>
                <span className="font-medium text-gray-900">
                  {formatMoney(selected.totalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Статус</span>
                <Badge tone={selected.status === "ACTIVE" ? "green" : "red"}>
                  {selected.status === "ACTIVE" ? "Активна" : "Отменена"}
                </Badge>
              </div>
            </div>

            {selected.status === "ACTIVE" ? (
              <form action={submitCancel} className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <Label htmlFor="cal-cancel-reason">Причина отмены (необязательно)</Label>
                  <Textarea id="cal-cancel-reason" name="reason" rows={2} />
                </div>
                <FieldError message={cancelError} />
                <div className="flex justify-end">
                  <Button type="submit" variant="danger" disabled={pending}>
                    {pending ? "Отмена..." : "Отменить бронь"}
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
