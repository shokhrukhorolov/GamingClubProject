"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientDTO } from "@/lib/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TH, TBody, TD, EmptyRow } from "@/components/ui/table";
import { ClientFormModal } from "./client-form-modal";
import { formatDate } from "@/lib/format";

export function ClientsList({ clients }: { clients: ClientDTO[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [creating, setCreating] = useState(false);

  const onSearch = (formData: FormData) => {
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/admin/clients?q=${encodeURIComponent(q)}` : "/admin/clients");
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form action={onSearch} className="flex items-center gap-2">
          <Input
            name="q"
            placeholder="Search by name or phone..."
            defaultValue={searchParams.get("q") ?? ""}
            className="w-72"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Button onClick={() => setCreating(true)}>+ New client</Button>
      </div>

      <Table>
        <THead>
          <TH>Name</TH>
          <TH>Phone</TH>
          <TH>Bookings</TH>
          <TH>Registered</TH>
        </THead>
        <TBody>
          {clients.length === 0 ? (
            <EmptyRow colSpan={4} message="No clients found" />
          ) : (
            clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <TD className="font-medium">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {client.name}
                  </Link>
                </TD>
                <TD>{client.phone}</TD>
                <TD>{client.bookingsCount}</TD>
                <TD>{formatDate(new Date(client.createdAt))}</TD>
              </tr>
            ))
          )}
        </TBody>
      </Table>

      <ClientFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
