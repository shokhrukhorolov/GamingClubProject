"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutClient } from "@/lib/client-auth/actions";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await logoutClient();
          router.push("/");
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
    >
      {label}
    </button>
  );
}
