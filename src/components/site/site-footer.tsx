import { getDictionary } from "@/lib/i18n/server";

export async function SiteFooter() {
  const t = await getDictionary();
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:px-6">
        <span>© {new Date().getFullYear()} gPoint</span>
        <span>{t.common.openDaily}</span>
      </div>
    </footer>
  );
}
