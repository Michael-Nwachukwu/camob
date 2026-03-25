"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

const links = [
  { href: "/", label: "Residence" },
  { href: "/explore", label: "Explore" },
  { href: "/book", label: "Bookings" },
  { href: "#concierge", label: "Concierge" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/50 px-5 shadow-ambient">
        <Link href="/" className="font-serif text-primary">
          <Image src="/camob_logo.svg" alt="Camob Residence logo" width={100} height={100} className="inlineblock w-28" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href.startsWith("#")
                  ? false
                  : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium text-muted transition-colors hover:text-primary",
                  active && "border-b border-secondary pb-1 text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/book"
            className="hidden rounded-full bg-silk px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 md:inline-flex"
          >
            Book Now
          </Link>
          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-primary/35 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full bg-[#061327] text-white transition-transform duration-300 ease-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col px-6 pb-8 pt-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center" onClick={() => setIsOpen(false)}>
              <Image
                src="/camob_logo.svg"
                alt="Camob Residence logo"
                width={120}
                height={48}
                className="h-auto w-32 brightness-0 invert"
              />
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Navigate</p>
            <nav className="mt-6 space-y-3">
              {links.map((link, index) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : link.href.startsWith("#")
                      ? false
                      : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      transitionDelay: isOpen ? `${120 + index * 70}ms` : "0ms"
                    }}
                    className={cn(
                      "block rounded-[1.25rem] px-4 py-4 text-2xl font-serif transition-[transform,opacity,background-color,color] duration-500",
                      isOpen ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
                      active ? "bg-white text-primary" : "bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div
            style={{
              transitionDelay: isOpen ? "380ms" : "0ms"
            }}
            className={cn(
              "mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 transition-[transform,opacity] duration-500",
              isOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            )}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Stay With Us</p>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Check availability, explore the neighborhood, and reach the concierge from one place.
            </p>
            <div className="mt-6 grid gap-3">
              <Link
                href="/book"
                className="inline-flex justify-center rounded-full bg-[#67e8e3] px-5 py-3 text-sm font-semibold text-black"
              >
                Book Now
              </Link>
              <a
                href="#concierge"
                className="inline-flex justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
              >
                Contact Concierge
              </a>
            </div>
          </div>

          <div
            style={{
              transitionDelay: isOpen ? "460ms" : "0ms"
            }}
            className={cn(
              "mt-auto pt-10 transition-[transform,opacity] duration-500",
              isOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            )}
          >
            <p className="text-sm text-white/45">Ogombo Town, Lekki Scheme 2, Lagos State, Nigeria</p>
          </div>
        </div>
      </div>
    </header>
  );
}
