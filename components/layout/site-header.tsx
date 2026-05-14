"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Stay" },
  { href: "/explore", label: "Neighbourhood" },
  { href: "/book", label: "Availability" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        scrolled ? "bg-canvas/85 backdrop-blur border-b border-hairline shadow-ambient" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/camob_logo.svg" alt="Camob Residence" width={100} height={100} className="w-28" />
          <span className="sr-only">Camob Residence</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 font-serif text-[15px] italic transition-colors",
                isActive(link.href)
                  ? "bg-surface-card text-ink"
                  : "text-charcoal hover:bg-surface-card/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/book"
            className="hidden md:inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed"
          >
            Reserve
          </Link>
          <button
            type="button"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink shadow-ambient"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 modal-scrim" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-3 top-20 rounded-lg bg-canvas p-5 shadow-scrim"
            >
              <p className="font-serif text-sm italic text-mute">— navigate</p>
              <nav className="mt-3 space-y-1">
                {links.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block rounded-md px-4 py-3 font-serif text-xl",
                        isActive(link.href) ? "bg-surface-card text-ink italic" : "text-charcoal"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <Link
                href="/book"
                onClick={() => setIsOpen(false)}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-ambient"
              >
                Reserve
              </Link>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
