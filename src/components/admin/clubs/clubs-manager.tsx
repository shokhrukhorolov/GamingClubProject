"use client";

import { useState, useTransition } from "react";
import { ClubDTO } from "@/lib/dto";
import { createClub, updateClub, deleteClub } from "@/lib/clubs/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TBody, TD, EmptyRow } from "@/components/ui/table";

export function ClubsManager({ clubs }: { clubs: ClubDTO[] }) {
  const [editing, setEditing] = useState<ClubDTO | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setEditing(null);
    setError(undefined);
  };

  const submit = (formData: FormData) => {
    const input = {
      name: formData.get("name"),
      city: formData.get("city") || "Tashkent",
      address: formData.get("address") || undefined,
      description: formData.get("description") || undefined,
      rating: formData.get("rating") || "",
      status: formData.get("status"),
      isMain: formData.get("isMain") === "on",
      sortOrder: formData.get("sortOrder") || 0,
    };
    startTransition(async () => {
      const result =
        editing === "new"
          ? await createClub(input)
          : await updateClub((editing as ClubDTO).id, input);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  const remove = (club: ClubDTO) => {
    if (!confirm(`Delete club "${club.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteClub(club.id);
      if (!result.ok) alert(result.error);
    });
  };

  const current = editing !== "new" && editing ? editing : null;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>+ New club</Button>
      </div>

      <Table>
        <THead>
          <TH>Name</TH>
          <TH>City</TH>
          <TH>Address</TH>
          <TH>Status</TH>
          <TH />
        </THead>
        <TBody>
          {clubs.length === 0 ? (
            <EmptyRow colSpan={5} message="No clubs yet" />
          ) : (
            clubs.map((club) => (
              <tr key={club.id} className="hover:bg-gray-50">
                <TD className="font-medium text-gray-900">
                  <span className="inline-flex items-center gap-2">
                    {club.name}
                    {club.isMain ? <Badge tone="indigo">Main</Badge> : null}
                  </span>
                </TD>
                <TD>{club.city}</TD>
                <TD>{club.address ?? "—"}</TD>
                <TD>
                  {club.status === "ACTIVE" ? (
                    <Badge tone="green">Active</Badge>
                  ) : (
                    <Badge tone="yellow">Coming soon</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditing(club)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => remove(club)}
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
        title={editing === "new" ? "New club" : "Edit club"}
      >
        <form action={submit} className="space-y-4">
          <div>
            <Label htmlFor="club-name">Name</Label>
            <Input id="club-name" name="name" defaultValue={current?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="club-city">City</Label>
              <Input id="club-city" name="city" defaultValue={current?.city ?? "Tashkent"} />
            </div>
            <div>
              <Label htmlFor="club-rating">Rating (0–5)</Label>
              <Input
                id="club-rating"
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                defaultValue={current?.rating ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="club-address">Address</Label>
            <Input id="club-address" name="address" defaultValue={current?.address ?? ""} />
          </div>
          <div>
            <Label htmlFor="club-desc">Description</Label>
            <Textarea
              id="club-desc"
              name="description"
              rows={2}
              defaultValue={current?.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="club-status">Status</Label>
              <Select id="club-status" name="status" defaultValue={current?.status ?? "COMING_SOON"}>
                <option value="ACTIVE">Active (bookable)</option>
                <option value="COMING_SOON">Coming soon</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="club-sort">Sort order</Label>
              <Input
                id="club-sort"
                name="sortOrder"
                type="number"
                defaultValue={current?.sortOrder ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isMain"
              defaultChecked={current?.isMain ?? false}
              className="h-4 w-4 rounded border-gray-300"
            />
            Main club (bookable flagship — only one)
          </label>
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
