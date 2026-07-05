import { LoginForm } from "@/components/site/auth/auth-forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-gray-900">Sign in</h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        Welcome back to Gaming Club
      </p>
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <LoginForm redirect={redirect ?? null} />
      </div>
    </div>
  );
}
