import Link from "next/link";
import { getClientId } from "@/lib/auth/require-client";
import { LogoutButton } from "./logout-button";

export async function SiteHeader() {
  const clientId = await getClientId();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            GC
          </span>
          <span className="text-base font-semibold text-gray-900">Gaming Club</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/book"
            className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
          >
            Book a seat
          </Link>
          {clientId ? (
            <>
              <Link
                href="/account"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                My account
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
