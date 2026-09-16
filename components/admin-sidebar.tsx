"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SignOutButton from "@/components/sign-out-button";

type Props = {
  fullName: string;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "⌂",
  },
  {
    label: "Events",
    href: "/admin/events",
    icon: "◫",
  },
  {
    label: "Team Members",
    href: "/admin/team-members",
    icon: "♙",
  },
  {
    label: "Galleries",
    href: "/admin/galleries",
    icon: "▧",
  },
];

export default function AdminSidebar({
  fullName,
}: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.08] bg-[#0b0d10] lg:block">
      <div className="sticky top-0 flex h-screen flex-col">

        {/* =====================================================
            LOGO
        ====================================================== */}

        <div className="flex h-20 items-center border-b border-white/[0.08] px-7">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.28em] text-white"
          >
            TRIZEN
          </Link>
        </div>

        {/* =====================================================
            NAVIGATION
        ====================================================== */}

        <nav className="flex-1 px-4 py-7">

          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-600">
            Workspace
          </p>

          <div className="space-y-1.5">

            {navigation.map((item) => {
              const active =
                isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
                    active
                      ? "bg-white/[0.10] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-zinc-500 hover:bg-white/[0.045] hover:text-zinc-200"
                  }`}
                >

                  {/* Active indicator */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                  )}

                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                      active
                        ? "bg-white/[0.10] text-white"
                        : "bg-white/[0.025] text-zinc-600 group-hover:text-zinc-300"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="font-medium">
                    {item.label}
                  </span>

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}

                </Link>
              );
            })}

          </div>
        </nav>

        {/* =====================================================
            USER
        ====================================================== */}

        <div className="border-t border-white/[0.08] p-4">

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                {fullName
                  .charAt(0)
                  .toUpperCase() || "A"}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-medium text-white">
                  {fullName}
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-600">
                  Administrator
                </p>

              </div>

            </div>

          </div>

          <div className="mt-2">
            <SignOutButton />
          </div>

        </div>

      </div>
    </aside>
  );
}