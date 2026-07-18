import Link from "next/link";
import { getClientId } from "@/lib/auth/require-client";
import { getDictionary } from "@/lib/i18n/server";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "./logout-button";
import { LocaleSwitcher } from "./locale-switcher";

export async function SiteHeader() {
  const [clientId, t] = await Promise.all([getClientId(), getDictionary()]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo size="sm" withTag={false} />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/clubs"
            className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
          >
            {t.nav.clubs}
          </Link>
          <Link
            href="/book"
            className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
          >
            {t.nav.bookSeat}
          </Link>
          <LocaleSwitcher />
          {clientId ? (
            <>
              <Link
                href="/account"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {t.nav.myAccount}
              </Link>
              <LogoutButton label={t.nav.logout} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {t.nav.signUp}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
