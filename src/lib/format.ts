import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** All dates in the app are displayed and entered in the club's local timezone. */
export const CLUB_TIMEZONE = "Asia/Tashkent";

export function formatMoney(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(amount)} UZS`;
}

export function formatDate(date: Date): string {
  return formatInTimeZone(date, CLUB_TIMEZONE, "d MMM yyyy");
}

export function formatDateTime(date: Date): string {
  return formatInTimeZone(date, CLUB_TIMEZONE, "d MMM yyyy, HH:mm");
}

export function formatTime(date: Date): string {
  return formatInTimeZone(date, CLUB_TIMEZONE, "HH:mm");
}

export function formatDateInput(date: Date): string {
  return formatInTimeZone(date, CLUB_TIMEZONE, "yyyy-MM-dd");
}

/** Convert a club-local "yyyy-MM-dd" + "HH:mm" pair into an absolute instant. */
export function clubTimeToDate(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, CLUB_TIMEZONE);
}

/** Start of the given club-local calendar day ("yyyy-MM-dd") as an absolute instant. */
export function clubDayStart(date: string): Date {
  return fromZonedTime(`${date}T00:00:00`, CLUB_TIMEZONE);
}

/** Current time in ms. Server Components fetch fresh data per request, so reading the clock is safe there. */
export function nowMs(): number {
  return Date.now();
}
