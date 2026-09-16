"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type WorkspaceSidebarProps = {
  userName?: string;
  userRole?: string;
};

const navigation = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "⌂" },
      { label: "AI Assistant", href: "/", icon: "✦" },
      { label: "Reports", href: "/reports", icon: "▥" },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Sales Pipeline", href: "/leads", icon: "◎" },
      { label: "Customers", href: "/customers", icon: "◉" },
      { label: "Tasks", href: "/tasks", icon: "✓" },
      { label: "Appointments", href: "/appointments", icon: "◷" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices", href: "/invoices", icon: "$" },
      { label: "Expenses", href: "/expenses", icon: "↘" },
      { label: "Salary", href: "/salary", icon: "₿" },
      { label: "Attendance", href: "/attendance", icon: "◫" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Team", href: "/team", icon: "♧" },
      { label: "Documents", href: "/documents", icon: "▤" },
    ],
  },
];

export default function WorkspaceSidebar({
  userName = "Workspace User",
  userRole = "Owner",
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white lg:hidden"
      >
        ☰
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#08111f]/95 px-4 py-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 font-black text-slate-950">
              B
            </div>

            <div>
              <p className="font-bold">BusinessPilot</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-cyan-300">
                AI workspace
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="text-slate-500 hover:text-white lg:hidden"
          >
            ×
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-xs text-slate-500">Current workspace</p>

          <p className="mt-1 truncate font-semibold">
            My Business Workspace
          </p>

          <p className="mt-2 inline-flex rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-300">
            {userRole}
          </p>
        </div>

        <nav className="mt-7 flex-1 space-y-6 overflow-y-auto">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-cyan-400 font-semibold text-slate-950 shadow-lg shadow-cyan-500/10"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.08] text-xs">
                        {item.icon}
                      </span>

                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 font-bold text-slate-950">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {userName}
              </p>

              <p className="text-xs text-slate-500">
                {userRole}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl border border-red-500/20 px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
