"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookingDTO } from "@/lib/dto";
import { cancelBooking } from "@/lib/bookings/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Textarea, Label, FieldError } from "@/components/ui/input";
import { Table, THead, TH, TBody, TD, EmptyRow } from "@/components/ui/table";
import { formatMoney, formatDateTime, formatTime } from "@/lib/format";

export function BookingsTable({
  bookings,
  showClient = true,
}: {
  bookings: BookingDTO[];
  showClient?: boolean;
}) {
  const [cancelling, setCancelling] = useState<BookingDTO | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setCancelling(null);
    setError(undefined);
  };

  const submitCancel = (formData: FormData) => {
    if (!cancelling) return;
    const reason = String(formData.get("reason") ?? "");
    startTransition(async () => {
      const result = await cancelBooking(cancelling.id, reason);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  const colSpan = showClient ? 6 : 5;

  return (
    <>
      <Table>
        <THead>
          <TH>Place</TH>
          {showClient ? <TH>Client</TH> : null}
          <TH>Time</TH>
          <TH>Price</TH>
          <TH>Status</TH>
          <TH />
        </THead>
        <TBody>
          {bookings.length === 0 ? (
            <EmptyRow colSpan={colSpan} message="No bookings found" />
          ) : (
            bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <TD>
                  <div className="font-medium text-gray-900">
                    {booking.clubName ?? "—"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.placeName} · {booking.categoryName}
                  </div>
                  {booking.paymentMethod ? (
                    <div className="text-xs text-gray-400">
                      {booking.paymentMethod}
                    </div>
                  ) : null}
                  {booking.snacks.length > 0 ? (
                    <div className="mt-1 text-xs text-amber-700">
                      🍿 {booking.snacks.map((s) => `${s.name} ×${s.quantity}`).join(", ")}
                    </div>
                  ) : null}
                </TD>
                {showClient ? (
                  <TD>
                    <Link
                      href={`/admin/clients/${booking.clientId}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {booking.clientName}
                    </Link>
                    <div className="text-xs text-gray-500">{booking.clientPhone}</div>
                  </TD>
                ) : null}
                <TD>
                  <div>{formatDateTime(new Date(booking.startsAt))}</div>
                  <div className="text-xs text-gray-500">
                    until {formatTime(new Date(booking.endsAt))}
                  </div>
                </TD>
                <TD className="font-medium text-gray-900">
                  {formatMoney(booking.totalPrice)}
                </TD>
                <TD>
                  {booking.status === "ACTIVE" ? (
                    <Badge tone="green">Active</Badge>
                  ) : (
                    <div>
                      <Badge tone="red">Cancelled</Badge>
                      {booking.cancelReason ? (
                        <div className="mt-1 text-xs text-gray-400">{booking.cancelReason}</div>
                      ) : null}
                    </div>
                  )}
                </TD>
                <TD className="text-right">
                  {booking.status === "ACTIVE" ? (
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setCancelling(booking)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </TD>
              </tr>
            ))
          )}
        </TBody>
      </Table>

      <Modal open={cancelling !== null} onClose={close} title="Cancel booking?">
        {cancelling ? (
          <form action={submitCancel} className="space-y-4">
            <p className="text-sm text-gray-600">
              {cancelling.placeName}, {formatDateTime(new Date(cancelling.startsAt))} —{" "}
              {cancelling.clientName}
            </p>
            <div>
              <Label htmlFor="cancel-reason">Reason (optional)</Label>
              <Textarea id="cancel-reason" name="reason" rows={2} />
            </div>
            <FieldError message={error} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={close}>
                Keep booking
              </Button>
              <Button type="submit" variant="danger" disabled={pending}>
                {pending ? "Cancelling..." : "Cancel booking"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
