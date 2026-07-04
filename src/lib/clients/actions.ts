"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";
import { Prisma } from "@/generated/prisma/client";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is required")
    .max(20)
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number"),
});

export async function createClient(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    const client = await prisma.client.create({ data: parsed.data });
    revalidatePath("/admin/clients");
    return ok({ id: client.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("A client with this phone number already exists");
    }
    throw e;
  }
}

export async function updateClient(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  try {
    await prisma.client.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("A client with this phone number already exists");
    }
    throw e;
  }
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return ok();
}
