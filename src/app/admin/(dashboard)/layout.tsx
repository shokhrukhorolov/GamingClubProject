import type { Metadata } from "next";
import { NavSidebar } from "@/components/admin/nav-sidebar";

export const metadata: Metadata = {
  title: "Gaming Club — Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <NavSidebar />
      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
