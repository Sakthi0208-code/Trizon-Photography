import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";

export default async function TeamMemberLayout({
  children,
}: {
  children: React.ReactNode;
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

  if (!profile || profile.role !== "TEAM_MEMBER") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-black">
        <div className="border-b border-white/10 p-6">
          <div className="text-lg font-semibold tracking-[0.25em]">
            TRIZEN
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Team Workspace
          </p>
        </div>

        <nav className="p-4">
          <a
            href="/team-member"
            className="block rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </a>

          <a
            href="/team-member"
            className="mt-1 block rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            My Events
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/[0.04] p-3">
            <p className="text-sm">
              {profile.full_name}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Team Member
            </p>
          </div>

          <SignOutButton />
        </div>
      </aside>

      <div className="ml-64">
        {children}
      </div>
    </div>
  );
}