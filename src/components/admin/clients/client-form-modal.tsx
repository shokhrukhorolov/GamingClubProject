"use client";

import { useState, useTransition } from "react";
import { createClient, updateClient } from "@/lib/clients/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function ClientFormModal({
  open,
  onClose,
  client,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  client?: { id: string; name: string; phone: string } | null;
  onCreated?: (id: string) => void;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setError(undefined);
    onClose();
  };

  const submit = (formData: FormData) => {
    const input = {
      name: formData.get("name"),
      phone: formData.get("phone"),
    };
    startTransition(async () => {
      if (client) {
        const result = await updateClient(client.id, input);
        if (result.ok) close();
        else setError(result.error);
      } else {
        const result = await createClient(input);
        if (result.ok) {
          if (result.data) onCreated?.(result.data.id);
          close();
        } else {
          setError(result.error);
        }
      }
    });
  };

  return (
    <Modal open={open} onClose={close} title={client ? "Изменить клиента" : "Новый клиент"}>
      <form action={submit} className="space-y-4">
        <div>
          <Label htmlFor="client-name">Имя</Label>
          <Input id="client-name" name="name" defaultValue={client?.name} required />
        </div>
        <div>
          <Label htmlFor="client-phone">Телефон</Label>
          <Input
            id="client-phone"
            name="phone"
            type="tel"
            placeholder="+998 90 123 45 67"
            defaultValue={client?.phone}
            required
          />
        </div>
        <FieldError message={error} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Отмена
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
