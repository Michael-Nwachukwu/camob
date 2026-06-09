"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/units", label: "Units" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/copilot", label: "Co-pilot" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex flex-wrap items-center gap-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-4 py-2 font-serif text-[15px] italic transition-colors",
              active ? "bg-surface-card text-ink" : "text-charcoal hover:bg-surface-card/70"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
