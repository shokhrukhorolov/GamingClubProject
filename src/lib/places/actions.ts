"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ActionResult, ok, fail } from "@/lib/action-result";

const placeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  type: z.enum(["SEAT", "ROOM_UNIT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  pricePerHour: z.coerce.number().positive("Price must be greater than zero"),
  categoryId: z.string().min(1, "Select a category"),
  roomId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
});

function revalidate() {
  revalidatePath("/admin/places");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
}

export async function createPlace(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.place.create({ data: parsed.data });
  revalidate();
  return ok();
}

export async function updatePlace(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  await prisma.place.update({ where: { id }, data: parsed.data });
  revalidate();
  return ok();
}

export async function setPlaceStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
): Promise<ActionResult> {
  await requireAdmin();
  await prisma.place.update({ where: { id }, data: { status } });
  revalidate();
  return ok();
}

export async function deletePlace(id: string): Promise<ActionResult> {
  await requireAdmin();
  const bookingsCount = await prisma.booking.count({ where: { placeId: id } });
  if (bookingsCount > 0) {
    return fail(
      `Cannot delete: place has ${bookingsCount} booking(s). Disable it instead.`
    );
  }
  await prisma.place.delete({ where: { id } });
  revalidate();
  return ok();
}
