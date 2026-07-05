"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loginClient, registerClient } from "@/lib/client-auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

function safeRedirect(target: string | null): string {
  if (target && target.startsWith("/") && !target.startsWith("/admin")) {
    return target;
  }
  return "/account";
}

export function LoginForm({ redirect }: { redirect: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const result = await loginClient({
        phone: formData.get("phone"),
        password: formData.get("password"),
      });
      if (result.ok) {
        router.push(safeRedirect(redirect));
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form action={submit} className="space-y-4">
      <div>
        <Label htmlFor="login-phone">Phone number</Label>
        <Input
          id="login-phone"
          name="phone"
          type="tel"
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
          required
        />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <FieldError message={error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-gray-500">
        No account yet?{" "}
        <Link
          href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ redirect }: { redirect: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      const result = await registerClient({
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email") || "",
        password: formData.get("password"),
      });
      if (result.ok) {
        router.push(safeRedirect(redirect));
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form action={submit} className="space-y-4">
      <div>
        <Label htmlFor="reg-name">Full name</Label>
        <Input id="reg-name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="reg-phone">Phone number</Label>
        <Input
          id="reg-phone"
          name="phone"
          type="tel"
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
          required
        />
      </div>
      <div>
        <Label htmlFor="reg-email">Email (optional)</Label>
        <Input id="reg-email" name="email" type="email" autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="mt-1 text-xs text-gray-400">At least 8 characters</p>
      </div>
      <FieldError message={error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
