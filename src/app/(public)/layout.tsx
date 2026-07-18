import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale, getDictionary } from "@/lib/i18n/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <LocaleProvider locale={locale} dict={dict}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
