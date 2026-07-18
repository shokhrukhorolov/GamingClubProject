"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";

const clubSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  city: z.string().trim().min(1).max(80).default("Tashkent"),
  address: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
  rating: z
    .union([z.coerce.number().min(0).max(5), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  status: z.enum(["ACTIVE", "COMING_SOON"]),
  isMain: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `club-${Date.now().toString(36)}`;
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  // avoid collisions
  while (true) {
    const existing = await prisma.club.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

function revalidate() {
  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
}

export async function createClub(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clubSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const slug = await uniqueSlug(parsed.data.name);
  // only one main club at a time
  if (parsed.data.isMain) {
    await prisma.club.updateMany({ data: { isMain: false }, where: { isMain: true } });
  }
  await prisma.club.create({ data: { ...parsed.data, slug } });
  revalidate();
  return ok();
}

export async function updateClub(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clubSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const slug = await uniqueSlug(parsed.data.name, id);
  if (parsed.data.isMain) {
    await prisma.club.updateMany({
      data: { isMain: false },
      where: { isMain: true, NOT: { id } },
    });
  }
  await prisma.club.update({ where: { id }, data: { ...parsed.data, slug } });
  revalidate();
  return ok();
}

export async function deleteClub(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.club.delete({ where: { id } });
  revalidate();
  return ok();
}
