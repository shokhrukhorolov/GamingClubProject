"use client";

import { useState, useTransition } from "react";
import { SnackDTO } from "@/lib/dto";
import {
  createSnack,
  updateSnack,
  setSnackAvailability,
  deleteSnack,
} from "@/lib/snacks/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TBody, TD, EmptyRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";

export function SnacksManager({ snacks }: { snacks: SnackDTO[] }) {
  const [editing, setEditing] = useState<SnackDTO | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setEditing(null);
    setError(undefined);
  };

  const submit = (formData: FormData) => {
    const input = {
      name: formData.get("name"),
      price: formData.get("price"),
      sortOrder: formData.get("sortOrder") || 0,
      isAvailable: formData.get("isAvailable") === "on",
    };
    startTransition(async () => {
      const result =
        editing === "new"
          ? await createSnack(input)
          : await updateSnack((editing as SnackDTO).id, input);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  const toggle = (snack: SnackDTO) => {
    startTransition(async () => {
      const result = await setSnackAvailability(snack.id, !snack.isAvailable);
      if (!result.ok) alert(result.error);
    });
  };

  const remove = (snack: SnackDTO) => {
    if (!confirm(`Delete "${snack.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteSnack(snack.id);
      if (!result.ok) alert(result.error);
    });
  };

  const current = editing !== "new" && editing ? editing : null;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>+ New snack</Button>
      </div>

      <Table>
        <THead>
          <TH>Name</TH>
          <TH>Price</TH>
          <TH>Availability</TH>
          <TH />
        </THead>
        <TBody>
          {snacks.length === 0 ? (
            <EmptyRow colSpan={4} message="No snacks yet" />
          ) : (
            snacks.map((snack) => (
              <tr key={snack.id} className="hover:bg-gray-50">
                <TD className="font-medium text-gray-900">{snack.name}</TD>
                <TD>{formatMoney(snack.price)}</TD>
                <TD>
                  {snack.isAvailable ? (
                    <Badge tone="green">Available</Badge>
                  ) : (
                    <Badge tone="gray">Hidden</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => toggle(snack)} disabled={pending}>
                      {snack.isAvailable ? "Hide" : "Show"}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(snack)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => remove(snack)}
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
        title={editing === "new" ? "New snack" : "Edit snack"}
      >
        <form action={submit} className="space-y-4">
          <div>
            <Label htmlFor="snack-name">Name</Label>
            <Input id="snack-name" name="name" defaultValue={current?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="snack-price">Price (сум)</Label>
              <Input
                id="snack-price"
                name="price"
                type="number"
                min="0"
                step="500"
                defaultValue={current?.price}
                required
              />
            </div>
            <div>
              <Label htmlFor="snack-sort">Sort order</Label>
              <Input
                id="snack-sort"
                name="sortOrder"
                type="number"
                defaultValue={current?.sortOrder ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isAvailable"
              defaultChecked={current?.isAvailable ?? true}
              className="h-4 w-4 rounded border-gray-300"
            />
            Available for clients
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
