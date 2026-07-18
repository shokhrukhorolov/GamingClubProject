"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { useLocale } from "@/lib/i18n/client";
import { LOCALES } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const { locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pick = (next: string) => {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-gray-200">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => pick(l)}
          disabled={pending}
          className={`px-2 py-1 text-xs font-semibold uppercase transition-colors cursor-pointer disabled:cursor-not-allowed ${
            l === locale
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
