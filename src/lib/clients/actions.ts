"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";
import { normalizePhone } from "@/lib/phone";
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

  const data = { ...parsed.data, phone: normalizePhone(parsed.data.phone) };

  try {
    const client = await prisma.client.create({ data });
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

  const data = { ...parsed.data, phone: normalizePhone(parsed.data.phone) };

  try {
    await prisma.client.update({ where: { id }, data });
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

const adjustSchema = z.object({
  amount: z.coerce
    .number()
    .refine((v) => v !== 0, "Amount cannot be zero")
    .refine((v) => Math.abs(v) <= 10_000_000, "Amount is too large"),
  note: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function adjustClientBalance(
  clientId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { amount, note } = parsed.data;

  const outcome = await prisma.$transaction(async (tx) => {
    if (amount < 0) {
      // guard: never let the balance go negative
      const updated = await tx.client.updateMany({
        where: { id: clientId, balance: { gte: -amount } },
        data: { balance: { decrement: -amount } },
      });
      if (updated.count === 0) return "insufficient" as const;
    } else {
      await tx.client.update({
        where: { id: clientId },
        data: { balance: { increment: amount } },
      });
    }
    await tx.balanceTransaction.create({
      data: { clientId, type: "TOPUP_ADMIN", amount, note },
    });
    return "ok" as const;
  });

  if (outcome === "insufficient") {
    return fail("Adjustment would make the balance negative");
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/account");
  return ok();
}
