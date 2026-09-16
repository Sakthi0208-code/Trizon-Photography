import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import AdminSidebar from "@/components/admin-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/team-member");
  }

  return (
    <div className="min-h-screen bg-[#07090c] text-white">
      <div className="flex min-h-screen">

        {/* ONLY ONE SIDEBAR */}
        <AdminSidebar
          fullName={
            profile.full_name || "Admin"
          }
        />

        <div className="min-w-0 flex-1">

          {/* ONLY ONE TOP BAR */}
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#07090c]/90 px-6 backdrop-blur-2xl lg:px-8">

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-600">
                Admin Workspace
              </p>

              <p className="mt-1 text-sm font-medium text-zinc-200">
                Photography Management
              </p>
            </div>

            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
            >
              View website →
            </Link>

          </header>

          <main className="relative">
            {children}
          </main>

        </div>

      </div>
    </div>
  );
}