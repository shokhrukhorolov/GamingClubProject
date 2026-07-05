"use client";

import { useState, useTransition } from "react";
import { adjustClientBalance } from "@/lib/clients/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";

export function BalanceAdjustModal({
  open,
  onClose,
  clientId,
  clientName,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setError(undefined);
    onClose();
  };

  const submit = (formData: FormData) => {
    const sign = formData.get("direction") === "subtract" ? -1 : 1;
    const amount = sign * Math.abs(Number(formData.get("amount")));
    startTransition(async () => {
      const result = await adjustClientBalance(clientId, {
        amount,
        note: formData.get("note") || undefined,
      });
      if (result.ok) close();
      else setError(result.error);
    });
  };

  return (
    <Modal open={open} onClose={close} title={`Adjust balance — ${clientName}`}>
      <form action={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="adj-direction">Operation</Label>
            <Select id="adj-direction" name="direction" defaultValue="add">
              <option value="add">Add funds</option>
              <option value="subtract">Subtract funds</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="adj-amount">Amount (UZS)</Label>
            <Input
              id="adj-amount"
              name="amount"
              type="number"
              min="500"
              step="500"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="adj-note">Note (optional)</Label>
          <Input id="adj-note" name="note" placeholder="Cash at desk" />
        </div>
        <FieldError message={error} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Apply"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
