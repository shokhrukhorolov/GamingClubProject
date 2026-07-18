"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";

const snackSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  sortOrder: z.coerce.number().int().default(0),
  isAvailable: z.coerce.boolean().default(true),
});

function revalidate() {
  revalidatePath("/admin/snacks");
  revalidatePath("/book");
}

export async function createSnack(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = snackSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.snack.create({ data: parsed.data });
  revalidate();
  return ok();
}

export async function updateSnack(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = snackSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.snack.update({ where: { id }, data: parsed.data });
  revalidate();
  return ok();
}

export async function setSnackAvailability(
  id: string,
  isAvailable: boolean
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.snack.update({ where: { id }, data: { isAvailable } });
  revalidate();
  return ok();
}

export async function deleteSnack(id: string): Promise<ActionResult> {
  await requireAdmin();
  const used = await prisma.bookingSnack.count({ where: { snackId: id } });
  if (used > 0) {
    return fail(
      `Cannot delete: this snack is on ${used} booking(s). Mark it unavailable instead.`
    );
  }
  await prisma.snack.delete({ where: { id } });
  revalidate();
  return ok();
}
