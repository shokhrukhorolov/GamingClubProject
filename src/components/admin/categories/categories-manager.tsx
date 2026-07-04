"use client";

import { useState, useTransition } from "react";
import { CategoryDTO } from "@/lib/dto";
import { createCategory, updateCategory, deleteCategory } from "@/lib/categories/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, THead, TH, TBody, TD, EmptyRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";

export function CategoriesManager({ categories }: { categories: CategoryDTO[] }) {
  const [editing, setEditing] = useState<CategoryDTO | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const close = () => {
    setEditing(null);
    setError(undefined);
  };

  const submit = (formData: FormData) => {
    const input = {
      name: formData.get("name"),
      defaultPricePerHour: formData.get("defaultPricePerHour"),
      sortOrder: formData.get("sortOrder") || 0,
    };
    startTransition(async () => {
      const result =
        editing === "new"
          ? await createCategory(input)
          : await updateCategory((editing as CategoryDTO).id, input);
      if (result.ok) close();
      else setError(result.error);
    });
  };

  const remove = (category: CategoryDTO) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (!result.ok) alert(result.error);
    });
  };

  const current = editing !== "new" && editing ? editing : null;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>+ New category</Button>
      </div>

      <Table>
        <THead>
          <TH>Name</TH>
          <TH>Default price</TH>
          <TH>Places</TH>
          <TH />
        </THead>
        <TBody>
          {categories.length === 0 ? (
            <EmptyRow colSpan={4} message="No categories yet" />
          ) : (
            categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <TD className="font-medium text-gray-900">{category.name}</TD>
                <TD>{formatMoney(category.defaultPricePerHour)}/hour</TD>
                <TD>{category.placesCount}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditing(category)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => remove(category)}
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
        title={editing === "new" ? "New category" : "Edit category"}
      >
        <form action={submit} className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" name="name" defaultValue={current?.name} required />
          </div>
          <div>
            <Label htmlFor="cat-price">Default price (UZS/hour)</Label>
            <Input
              id="cat-price"
              name="defaultPricePerHour"
              type="number"
              min="0"
              step="500"
              defaultValue={current?.defaultPricePerHour}
              required
            />
          </div>
          <div>
            <Label htmlFor="cat-sort">Sort order</Label>
            <Input
              id="cat-sort"
              name="sortOrder"
              type="number"
              defaultValue={current?.sortOrder ?? 0}
            />
          </div>
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
