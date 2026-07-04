"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";
import { Prisma } from "@/generated/prisma/client";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Укажите название").max(100),
  defaultPricePerHour: z.coerce.number().positive("Цена должна быть больше нуля"),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createCategory(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await prisma.category.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("Категория с таким названием уже существует");
    }
    throw e;
  }
  revalidatePath("/admin/categories");
  return ok();
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await prisma.category.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("Категория с таким названием уже существует");
    }
    throw e;
  }
  revalidatePath("/admin/categories");
  return ok();
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const placesCount = await prisma.place.count({ where: { categoryId: id } });
  if (placesCount > 0) {
    return fail(`Нельзя удалить: в категории ещё ${placesCount} мест(а)`);
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return ok();
}
