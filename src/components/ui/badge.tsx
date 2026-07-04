type Tone = "green" | "red" | "yellow" | "gray" | "indigo";

const tones: Record<Tone, string> = {
  green: "bg-green-50 text-green-700 ring-green-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  gray: "bg-gray-50 text-gray-600 ring-gray-500/20",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
