"use client";

import { useState, useTransition } from "react";
import { PlaceDTO, CategoryDTO, RoomDTO } from "@/lib/dto";
import { createPlace, updatePlace, setPlaceStatus, deletePlace } from "@/lib/places/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TBody, TD, EmptyRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";

const statusLabels: Record<PlaceDTO["status"], { label: string; tone: "green" | "gray" | "yellow" }> = {
  ACTIVE: { label: "Active", tone: "green" },
  INACTIVE: { label: "Disabled", tone: "gray" },
  MAINTENANCE: { label: "Maintenance", tone: "yellow" },
};

const typeLabels: Record<PlaceDTO["type"], string> = {
  SEAT: "Seat",
  ROOM_UNIT: "Whole room",
};

export function PlacesManager({
  places,
  categories,
  rooms,
}: {
  places: PlaceDTO[];
  categories: CategoryDTO[];
  rooms: RoomDTO[];
}) {
  const [editing, setEditing] = useState<PlaceDTO | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setEditing(null);
    setError(undefined);
  };

  const submit = (formData: FormData) => {
    const input = {
      name: formData.get("name"),
      type: formData.get("type"),
      status: formData.get("status"),
      pricePerHour: formData.get("pricePerHour"),
      categoryId: formData.get("categoryId"),
      roomId: formData.get("roomId") || undefined,
    };
    startTransition(async () => {
      const result =
        editing === "new"
          ? await createPlace(input)
          : await updatePlace((editing as PlaceDTO).id, input);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  const toggleStatus = (place: PlaceDTO) => {
    const next = place.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    startTransition(async () => {
      const result = await setPlaceStatus(place.id, next);
      if (!result.ok) alert(result.error);
    });
  };

  const remove = (place: PlaceDTO) => {
    if (!confirm(`Delete place "${place.name}"? Usually disabling it is enough.`)) return;
    startTransition(async () => {
      const result = await deletePlace(place.id);
      if (!result.ok) alert(result.error);
    });
  };

  const current = editing !== "new" && editing ? editing : null;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")} disabled={categories.length === 0}>
          + New place
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Create at least one category first.
        </p>
      ) : null}

      <Table>
        <THead>
          <TH>Name</TH>
          <TH>Type</TH>
          <TH>Category</TH>
          <TH>Room</TH>
          <TH>Price</TH>
          <TH>Status</TH>
          <TH />
        </THead>
        <TBody>
          {places.length === 0 ? (
            <EmptyRow colSpan={7} message="No places yet" />
          ) : (
            places.map((place) => {
              const status = statusLabels[place.status];
              return (
                <tr key={place.id} className="hover:bg-gray-50">
                  <TD className="font-medium text-gray-900">{place.name}</TD>
                  <TD>{typeLabels[place.type]}</TD>
                  <TD>{place.categoryName}</TD>
                  <TD>{place.roomName ?? "—"}</TD>
                  <TD>{formatMoney(place.pricePerHour)}/hour</TD>
                  <TD>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => toggleStatus(place)} disabled={pending}>
                        {place.status === "ACTIVE" ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" onClick={() => setEditing(place)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => remove(place)}
                        disabled={pending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TD>
                </tr>
              );
            })
          )}
        </TBody>
      </Table>

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "New place" : "Edit place"}
      >
        <form action={submit} className="space-y-4">
          <div>
            <Label htmlFor="place-name">Name</Label>
            <Input
              id="place-name"
              name="name"
              placeholder="Seat 1 / VIP Room A"
              defaultValue={current?.name}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="place-type">Type</Label>
              <Select id="place-type" name="type" defaultValue={current?.type ?? "SEAT"}>
                <option value="SEAT">Seat</option>
                <option value="ROOM_UNIT">Whole room</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="place-status">Status</Label>
              <Select id="place-status" name="status" defaultValue={current?.status ?? "ACTIVE"}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Disabled</option>
                <option value="MAINTENANCE">Maintenance</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="place-category">Category</Label>
            <Select
              id="place-category"
              name="categoryId"
              defaultValue={current?.categoryId ?? categories[0]?.id}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="place-room">Room (optional)</Label>
            <Select id="place-room" name="roomId" defaultValue={current?.roomId ?? ""}>
              <option value="">No room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="place-price">Price (UZS/hour)</Label>
            <Input
              id="place-price"
              name="pricePerHour"
              type="number"
              min="0"
              step="500"
              defaultValue={current?.pricePerHour}
              required
            />
          </div>
          <FieldError message={error} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
