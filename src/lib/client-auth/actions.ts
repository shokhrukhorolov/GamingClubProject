"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ActionResult, ok, fail } from "@/lib/action-result";
import { normalizePhone } from "@/lib/phone";
import {
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_MAX_AGE,
  createClientSessionToken,
} from "@/lib/auth/client-session";
import { Prisma } from "@/generated/prisma/client";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required")
  .max(20)
  .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number");

const registerSchema = z.object({
  name: z.string().trim().min(1, "Full name is required").max(150),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

// dummy hash so a login attempt for an unknown phone still runs one bcrypt compare
const DUMMY_HASH = "$2b$10$C6UzMDM.H6dfI/f/IKcEeO7ZUor4z9Sbk5q0lZ9hHwXn0y1e6R9GG";

async function setClientCookie(clientId: string) {
  const token = await createClientSessionToken(clientId);
  const store = await cookies();
  store.set(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CLIENT_SESSION_MAX_AGE,
  });
}

export async function registerClient(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { name, email, password } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const client = await prisma.client.create({
      data: { name, phone, email, passwordHash },
    });
    await setClientCookie(client.id);
    return ok();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail(
        "This phone number is already registered. Please sign in, or visit the club to activate your online account."
      );
    }
    throw e;
  }
}

export async function loginClient(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const phone = normalizePhone(parsed.data.phone);
  const client = await prisma.client.findUnique({ where: { phone } });

  const hash = client?.passwordHash ?? DUMMY_HASH;
  const valid = await bcrypt.compare(parsed.data.password, hash);

  if (!client || !client.passwordHash || !valid) {
    return fail("Invalid phone number or password");
  }

  await setClientCookie(client.id);
  return ok();
}

export async function logoutClient(): Promise<ActionResult> {
  const store = await cookies();
  store.set(CLIENT_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return ok();
}
