"use client";

import { useMemo, useState, useTransition } from "react";
import { createBooking } from "@/lib/bookings/actions";
import { PlaceDTO } from "@/lib/dto";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ClientFormModal } from "@/components/admin/clients/client-form-modal";
import { formatMoney } from "@/lib/format";

export type ClientOption = { id: string; name: string; phone: string };

export type BookingPrefill = {
  placeId?: string;
  date?: string; // yyyy-MM-dd
  time?: string; // HH:mm
};

const DURATIONS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];

export function BookingFormModal({
  open,
  onClose,
  places,
  clients,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  places: PlaceDTO[];
  clients: ClientOption[];
  prefill?: BookingPrefill;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientId, setClientId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [duration, setDuration] = useState(1);

  const activePlaces = useMemo(
    () => places.filter((p) => p.status === "ACTIVE"),
    [places]
  );

  const effectivePlaceId = placeId || prefill?.placeId || activePlaces[0]?.id || "";
  const selectedPlace = activePlaces.find((p) => p.id === effectivePlaceId);
  const price = selectedPlace ? selectedPlace.pricePerHour * duration : null;

  const close = () => {
    setError(undefined);
    setClientId("");
    setPlaceId("");
    setDuration(1);
    onClose();
  };

  const submit = (formData: FormData) => {
    const input = {
      placeId: formData.get("placeId"),
      clientId: formData.get("clientId"),
      date: formData.get("date"),
      time: formData.get("time"),
      durationHours: formData.get("durationHours"),
    };
    startTransition(async () => {
      const result = await createBooking(input);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Modal open={open} onClose={close} title="New booking">
        <form action={submit} className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="bk-client">Client</Label>
              <button
                type="button"
                onClick={() => setCreatingClient(true)}
                className="text-sm font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                + New client
              </button>
            </div>
            <Select
              id="bk-client"
              name="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select a client...
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} — {client.phone}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="bk-place">Place</Label>
            <Select
              id="bk-place"
              name="placeId"
              value={effectivePlaceId}
              onChange={(e) => setPlaceId(e.target.value)}
              required
            >
              {activePlaces.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                  {place.roomName ? ` (${place.roomName})` : ""} — {place.categoryName},{" "}
                  {formatMoney(place.pricePerHour)}/hour
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="bk-date">Date</Label>
              <Input
                id="bk-date"
                name="date"
                type="date"
                defaultValue={prefill?.date ?? today}
                required
              />
            </div>
            <div>
              <Label htmlFor="bk-time">Time</Label>
              <Input
                id="bk-time"
                name="time"
                type="time"
                step={1800}
                defaultValue={prefill?.time ?? "14:00"}
                required
              />
            </div>
            <div>
              <Label htmlFor="bk-duration">Hours</Label>
              <Select
                id="bk-duration"
                name="durationHours"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {price !== null ? (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Total price: </span>
              <span className="font-semibold text-gray-900">{formatMoney(price)}</span>
            </div>
          ) : null}

          <FieldError message={error} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || activePlaces.length === 0}>
              {pending ? "Creating..." : "Create booking"}
            </Button>
          </div>
        </form>
      </Modal>

      <ClientFormModal
        open={creatingClient}
        onClose={() => setCreatingClient(false)}
        onCreated={(id) => setClientId(id)}
      />
    </>
  );
}
