"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fromZonedTime } from "date-fns-tz";
import { SnackDTO } from "@/lib/dto";
import { createClientBooking } from "@/lib/bookings/client-actions";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { formatMoney, CLUB_TIMEZONE, nowMs } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n/client";
import { OPEN_HOUR, CLOSE_HOUR } from "@/lib/date/business-hours";
import {
  SnacksPicker,
  SnackSelection,
  snacksSubtotal,
  selectionToPayload,
} from "@/components/site/book/snacks-picker";

export type FlowPlace = {
  id: string;
  name: string;
  seatNo: string;
  categoryId: string;
  categoryName: string;
  pricePerHour: number;
};
export type FlowBusy = { placeId: string; startsAt: string; endsAt: string };

const DURATIONS = [1, 2, 3, 4, 5, 6];
const PAYMENTS = [
  { id: "UZUM", label: "Uzum Card" },
  { id: "CLICK", label: "Click" },
  { id: "PAYME", label: "Payme" },
  { id: "CASH", label: "" }, // localized below
];
const MAX_DAYS_AHEAD = 30;

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function startMs(date: string, time: string): number {
  return fromZonedTime(`${date}T${time}:00`, CLUB_TIMEZONE).getTime();
}

export function BookingFlow({
  clubName,
  places,
  categories,
  busy,
  snacks,
}: {
  clubName: string;
  places: FlowPlace[];
  categories: { id: string; name: string }[];
  busy: FlowBusy[];
  snacks: SnackDTO[];
}) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const today = new Date(nowMs());
  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [date, setDate] = useState<string>(ymd(today));
  const [time, setTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(2);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [payment, setPayment] = useState("CASH");
  const [snackSel, setSnackSel] = useState<SnackSelection>({});
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const intl = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", opts);

  const busyByPlace = useMemo(() => {
    const m = new Map<string, { s: number; e: number }[]>();
    for (const b of busy) {
      const list = m.get(b.placeId) ?? [];
      list.push({ s: new Date(b.startsAt).getTime(), e: new Date(b.endsAt).getTime() });
      m.set(b.placeId, list);
    }
    return m;
  }, [busy]);

  const isFree = (pid: string, s: number, e: number) =>
    !(busyByPlace.get(pid) ?? []).some((b) => s < b.e && e > b.s);

  const tierPlaces = useMemo(
    () => places.filter((p) => p.categoryId === categoryId),
    [places, categoryId]
  );

  // start times that have at least one free seat in the chosen tier
  const times = useMemo(() => {
    const out: { value: string; free: boolean }[] = [];
    const now = nowMs();
    for (let h = OPEN_HOUR; h + duration <= CLOSE_HOUR; h++) {
      const value = `${String(h).padStart(2, "0")}:00`;
      const s = startMs(date, value);
      const e = s + duration * 3_600_000;
      const free =
        s > now + 5 * 60_000 && tierPlaces.some((p) => isFree(p.id, s, e));
      out.push({ value, free });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, duration, tierPlaces, busyByPlace]);

  const seats = useMemo(() => {
    if (!time) return [];
    const s = startMs(date, time);
    const e = s + duration * 3_600_000;
    return tierPlaces.map((p) => ({ ...p, free: isFree(p.id, s, e) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, date, duration, tierPlaces, busyByPlace]);

  const selectedPlace = seats.find((p) => p.id === placeId && p.free) ?? null;
  const snacksTotal = snacksSubtotal(snacks, snackSel);
  const total = selectedPlace ? selectedPlace.pricePerHour * duration + snacksTotal : 0;

  // ---- calendar grid (Monday-first) ----
  const monthDays = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Mon = 0
    const daysInMonth = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + 1,
      0
    ).getDate();
    const cells: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    return cells;
  }, [viewMonth]);

  const todayYmd = ymd(today);
  const maxYmd = ymd(new Date(nowMs() + MAX_DAYS_AHEAD * 86_400_000));
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((_, i) =>
    intl({ weekday: "short" }).format(new Date(2024, 0, 1 + i))
  );

  const reset = () => {
    setTime(null);
    setPlaceId(null);
  };

  const submit = () => {
    if (!selectedPlace || !time) return;
    startTransition(async () => {
      const result = await createClientBooking({
        placeId: selectedPlace.id,
        date,
        time,
        durationHours: duration,
        paymentMethod: payment,
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

  if (success) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-7 w-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {t.book.bookingConfirmed}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{t.book.confirmedText}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSuccess(false);
              reset();
              setSnackSel({});
            }}
          >
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
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. calendar */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{t.flow.chooseDate}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                )
              }
              className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              ‹
            </button>
            <span className="min-w-[130px] text-center text-sm font-medium text-gray-900">
              {intl({ month: "long", year: "numeric" }).format(viewMonth)}
            </span>
            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                )
              }
              className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-md grid-cols-7 gap-1 text-center">
          {weekdays.map((w) => (
            <div key={w} className="pb-1 text-[11px] uppercase text-gray-400">
              {w}
            </div>
          ))}
          {monthDays.map((d, i) => {
            if (!d) return <div key={`b${i}`} />;
            const v = ymd(d);
            const disabled = v < todayYmd || v > maxYmd;
            const isSel = v === date;
            return (
              <button
                key={v}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setDate(v);
                  reset();
                }}
                className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                  isSel
                    ? "bg-indigo-600 text-white"
                    : disabled
                      ? "text-gray-300"
                      : "text-gray-700 hover:bg-indigo-50"
                } ${v === todayYmd && !isSel ? "ring-1 ring-indigo-300" : ""} ${
                  disabled ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. type + duration */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">{t.flow.type}</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategoryId(c.id);
                reset();
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium cursor-pointer ${
                c.id === categoryId
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <h3 className="mb-2 mt-5 text-sm font-semibold text-gray-900">
          {t.flow.duration}
        </h3>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setDuration(h);
                reset();
              }}
              className={`w-12 rounded-lg py-2 text-sm font-medium cursor-pointer ${
                h === duration
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </section>

      {/* 3. time */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t.flow.chooseTime}</h3>
        {times.every((x) => !x.free) ? (
          <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {t.flow.noFreeTimes}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {times.map((x) => (
              <button
                key={x.value}
                type="button"
                disabled={!x.free}
                onClick={() => {
                  setTime(x.value);
                  setPlaceId(null);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  x.value === time
                    ? "bg-indigo-600 text-white cursor-pointer"
                    : x.free
                      ? "border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                      : "border border-gray-100 text-gray-300 line-through cursor-not-allowed"
                }`}
              >
                {x.value}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 4. seats */}
      {time ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{t.flow.seat}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <i className="inline-block h-3 w-3 rounded bg-green-100 ring-1 ring-green-300" />
                {t.flow.freeLabel}
              </span>
              <span className="flex items-center gap-1">
                <i className="inline-block h-3 w-3 rounded bg-indigo-600" />
                {t.flow.selected}
              </span>
              <span className="flex items-center gap-1">
                <i className="inline-block h-3 w-3 rounded bg-gray-200" />
                {t.flow.taken}
              </span>
            </div>
          </div>

          {seats.length === 0 || seats.every((s) => !s.free) ? (
            <p className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              {t.flow.noFreeSeats}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {seats.map((s) => {
                const sel = s.id === placeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!s.free}
                    onClick={() => setPlaceId(s.id)}
                    title={s.name}
                    className={`h-12 rounded-lg text-sm font-semibold transition-colors ${
                      sel
                        ? "bg-indigo-600 text-white"
                        : s.free
                          ? "bg-green-50 text-green-800 ring-1 ring-green-300 hover:bg-green-100 cursor-pointer"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {s.seatNo}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* 5. snacks */}
      {selectedPlace ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SnacksPicker snacks={snacks} selection={snackSel} onChange={setSnackSel} />
        </section>
      ) : null}

      {/* 6. payment + confirm */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t.flow.payment}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPayment(p.id)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer ${
                p.id === payment
                  ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p.id === "CASH" ? t.flow.cash : p.label}
              <span
                className={`h-4 w-4 rounded-full border ${
                  p.id === payment ? "border-8 border-indigo-600" : "border-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div>
            <div className="text-xs text-gray-500">{t.flow.total}</div>
            <div className="text-2xl font-bold text-gray-900">{formatMoney(total)}</div>
            {selectedPlace ? (
              <div className="text-xs text-gray-400">
                {clubName} · {selectedPlace.name} · {date} {time} · {duration}
                {locale === "ru" ? " ч" : "h"}
              </div>
            ) : null}
          </div>
          <Button onClick={submit} disabled={pending || !selectedPlace}>
            {pending
              ? t.flow.booking
              : selectedPlace
                ? t.clubs.book
                : t.flow.pickSeatFirst}
          </Button>
        </div>

        <p className="mt-3 rounded-lg bg-indigo-50 px-4 py-2.5 text-center text-sm text-indigo-800">
          {t.book.payAtClub}
        </p>

        <FieldError message={error} />
      </section>
    </div>
  );
}
