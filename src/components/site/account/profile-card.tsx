"use client";

import { useState, useTransition } from "react";
import { updateMyProfile } from "@/lib/account/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function ProfileCard({
  profile,
}: {
  profile: { name: string; phone: string; email: string | null };
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setEditing(false);
    setError(undefined);
  };

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateMyProfile({
        name: formData.get("name"),
        email: formData.get("email") || "",
      });
      if (result.ok) close();
      else setError(result.error);
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Profile</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{profile.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{profile.phone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{profile.email ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>

      <Modal open={editing} onClose={close} title="Edit profile">
        <form action={submit} className="space-y-4">
          <div>
            <Label htmlFor="pf-name">Full name</Label>
            <Input id="pf-name" name="name" defaultValue={profile.name} required />
          </div>
          <div>
            <Label htmlFor="pf-email">Email (optional)</Label>
            <Input
              id="pf-email"
              name="email"
              type="email"
              defaultValue={profile.email ?? ""}
            />
          </div>
          <p className="text-xs text-gray-400">
            Phone number is your sign-in ID and can only be changed at the club desk.
          </p>
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
    </div>
  );
}
