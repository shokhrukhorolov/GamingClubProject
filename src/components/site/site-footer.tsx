export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:px-6">
        <span>© {new Date().getFullYear()} Gaming Club</span>
        <span>Open daily · Tashkent</span>
      </div>
    </footer>
  );
}
