"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireClientId } from "@/lib/auth/require-client";
import { ActionResult, ok, fail } from "@/lib/action-result";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(150),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export async function updateMyProfile(input: unknown): Promise<ActionResult> {
  const clientId = await requireClientId();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.client.update({ where: { id: clientId }, data: parsed.data });

  revalidatePath("/account");
  revalidatePath(`/admin/clients/${clientId}`);
  return ok();
}
