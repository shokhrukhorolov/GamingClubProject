"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";

const roomSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function createRoom(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.room.create({ data: parsed.data });
  revalidatePath("/admin/rooms");
  return ok();
}

export async function updateRoom(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.room.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/rooms");
  return ok();
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  await requireAdmin();
  const placesCount = await prisma.place.count({ where: { roomId: id } });
  if (placesCount > 0) {
    return fail(`Cannot delete: room still has ${placesCount} place(s)`);
  }
  await prisma.room.delete({ where: { id } });
  revalidatePath("/admin/rooms");
  return ok();
}
