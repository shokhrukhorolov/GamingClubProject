"use client";

import { SnackDTO } from "@/lib/dto";
import { useT } from "@/lib/i18n/client";
import { formatMoney } from "@/lib/format";

export type SnackSelection = Record<string, number>; // snackId -> quantity

export function SnacksPicker({
  snacks,
  selection,
  onChange,
}: {
  snacks: SnackDTO[];
  selection: SnackSelection;
  onChange: (next: SnackSelection) => void;
}) {
  const t = useT();

  const setQty = (id: string, qty: number) => {
    const next = { ...selection };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    onChange(next);
  };

  if (snacks.length === 0) return null;

  return (
    <div>
      <div className="mb-1 text-sm font-medium text-gray-900">{t.book.addSnacks}</div>
      <p className="mb-3 text-xs text-gray-500">{t.book.addSnacksSub}</p>
      <div className="max-h-56 space-y-1.5 overflow-y-auto">
        {snacks.map((snack) => {
          const qty = selection[snack.id] ?? 0;
          return (
            <div
              key={snack.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {snack.name}
                </div>
                <div className="text-xs text-gray-500">{formatMoney(snack.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty(snack.id, qty - 1)}
                  disabled={qty === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(snack.id, qty + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function snacksSubtotal(snacks: SnackDTO[], selection: SnackSelection): number {
  return snacks.reduce((sum, s) => sum + (selection[s.id] ?? 0) * s.price, 0);
}

export function selectionToPayload(
  selection: SnackSelection
): { snackId: string; quantity: number }[] {
  return Object.entries(selection).map(([snackId, quantity]) => ({ snackId, quantity }));
}
