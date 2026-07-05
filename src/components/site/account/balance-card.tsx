"use client";

import { useState } from "react";
import { BalanceTransactionDTO } from "@/lib/dto";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDateTime } from "@/lib/format";

const typeLabels: Record<BalanceTransactionDTO["type"], string> = {
  TOPUP_ADMIN: "Top-up",
  BOOKING_CHARGE: "Booking payment",
  BOOKING_REFUND: "Refund",
};

export function BalanceCard({
  balance,
  transactions,
}: {
  balance: number;
  transactions: BalanceTransactionDTO[];
}) {
  const [showTopupNote, setShowTopupNote] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Balance</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatMoney(balance)}
          </p>
        </div>
        <Button onClick={() => setShowTopupNote((v) => !v)}>Top up</Button>
      </div>

      {showTopupNote ? (
        <p className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Online payment (Uzcard, Humo, Visa, Mastercard) is coming soon. For
          now, top up your balance at the club desk — it appears here instantly.
        </p>
      ) : null}

      <button
        onClick={() => setShowHistory((v) => !v)}
        className="mt-4 text-sm font-medium text-indigo-600 hover:underline cursor-pointer"
      >
        {showHistory ? "Hide history" : "Transaction history"}
      </button>

      {showHistory ? (
        transactions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">No transactions yet</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-gray-900">
                    {typeLabels[t.type]}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDateTime(new Date(t.createdAt))}
                    {t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>
                <span
                  className={`font-semibold ${t.amount >= 0 ? "text-green-600" : "text-gray-900"}`}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {formatMoney(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
