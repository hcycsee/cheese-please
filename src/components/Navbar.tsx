"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { displayName } from "@/lib/format";

const LINKS = [
  { href: "/dashboard", label: "Online now" },
  { href: "/friends", label: "Friends" },
  { href: "/match", label: "Find a group" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar({ user }: { user: { name: string; preferredName?: string | null } }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-extrabold text-cheese-600">
            👾 unipixel
          </Link>
          <div className="hidden gap-1 sm:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  pathname.startsWith(link.href) ? "bg-cheese-100 text-cheese-700" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-stone-500 sm:inline">Hi, {displayName(user)}</span>
          <button onClick={logout} className="btn-ghost text-sm">
            Log out
          </button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-stone-100 px-3 py-2 sm:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
              pathname.startsWith(link.href) ? "bg-cheese-100 text-cheese-700" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
