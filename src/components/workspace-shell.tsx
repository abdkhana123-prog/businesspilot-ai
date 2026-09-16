"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import WorkspaceSidebar from "@/components/workspace-sidebar";

type WorkspaceShellProps = {
  children: ReactNode;
};

const publicRoutes = [
  "/login",
  "/signup",
  "/invite",
];

export default function WorkspaceShell({
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();

  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex min-h-screen">
        <WorkspaceSidebar />

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
