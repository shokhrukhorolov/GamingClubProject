"use client";

import { useState, useTransition } from "react";
import { RoomDTO } from "@/lib/dto";
import { createRoom, updateRoom, deleteRoom } from "@/lib/rooms/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, THead, TH, TBody, TD, EmptyRow } from "@/components/ui/table";

export function RoomsManager({ rooms }: { rooms: RoomDTO[] }) {
  const [editing, setEditing] = useState<RoomDTO | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setEditing(null);
    setError(undefined);
  };

  const submit = (formData: FormData) => {
    const input = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
    };
    startTransition(async () => {
      const result =
        editing === "new"
          ? await createRoom(input)
          : await updateRoom((editing as RoomDTO).id, input);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  const remove = (room: RoomDTO) => {
    if (!confirm(`Delete room "${room.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteRoom(room.id);
      if (!result.ok) alert(result.error);
    });
  };

  const current = editing !== "new" && editing ? editing : null;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>+ New room</Button>
      </div>

      <Table>
        <THead>
          <TH>Name</TH>
          <TH>Description</TH>
          <TH>Places</TH>
          <TH />
        </THead>
        <TBody>
          {rooms.length === 0 ? (
            <EmptyRow colSpan={4} message="No rooms yet" />
          ) : (
            rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <TD className="font-medium text-gray-900">{room.name}</TD>
                <TD>{room.description ?? "—"}</TD>
                <TD>{room.placesCount}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditing(room)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => remove(room)}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  </div>
                </TD>
              </tr>
            ))
          )}
        </TBody>
      </Table>

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "New room" : "Edit room"}
      >
        <form action={submit} className="space-y-4">
          <div>
            <Label htmlFor="room-name">Name</Label>
            <Input id="room-name" name="name" defaultValue={current?.name} required />
          </div>
          <div>
            <Label htmlFor="room-desc">Description</Label>
            <Textarea
              id="room-desc"
              name="description"
              rows={3}
              defaultValue={current?.description ?? ""}
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
