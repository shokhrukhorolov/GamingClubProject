"use client";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";

const DURATIONS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];

export function SearchForm({
  categories,
  defaults,
}: {
  categories: { id: string; name: string }[];
  defaults: { category: string; date: string; time: string; duration: string };
}) {
  const t = useT();
  return (
    <form
      method="get"
      action="/book"
      className="grid grid-cols-2 items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-4 lg:grid-cols-5"
    >
      <div className="col-span-2 sm:col-span-1 lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-gray-500">
          {t.book.category}
        </label>
        <Select name="category" defaultValue={defaults.category} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          {t.common.date}
        </label>
        <Input type="date" name="date" defaultValue={defaults.date} required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          {t.common.time}
        </label>
        <Input
          type="time"
          name="time"
          step={1800}
          defaultValue={defaults.time}
          required
        />
      </div>
      <div className="col-span-2 flex items-end gap-3 sm:col-span-1">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            {t.common.hours}
          </label>
          <Select name="duration" defaultValue={defaults.duration}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="shrink-0">
          {t.common.search}
        </Button>
      </div>
    </form>
  );
}
