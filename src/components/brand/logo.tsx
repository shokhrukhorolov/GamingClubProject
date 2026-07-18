/**
 * gPoint brand marks. Neon violet→fuchsia gradient wordmark inspired by
 * esports-club branding. Tailwind-only, no images.
 */

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.55)] ${className}`}
    >
      g
    </span>
  );
}

export function Logo({
  size = "md",
  withTag = true,
}: {
  size?: "sm" | "md";
  withTag?: boolean;
}) {
  const wordClass =
    size === "sm" ? "text-lg leading-none" : "text-xl leading-none";
  const markClass = size === "sm" ? "h-8 w-8 text-sm" : "h-9 w-9 text-base";

  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={markClass} />
      <span className="flex flex-col">
        <span
          className={`bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text font-extrabold tracking-tight text-transparent ${wordClass}`}
        >
          gPoint
        </span>
        {withTag ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Gaming · Tashkent
          </span>
        ) : null}
      </span>
    </span>
  );
}
