"use client";

import { useEffect, useState } from "react";
import { Menu, X, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { siteCopy, apartmentTypes } from "@/lib/data/camob";

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

      {/* Full-screen mobile drawer */}
      <AnimatePresence>
        {isOpen ? <MobileDrawer pathname={pathname} onClose={() => setIsOpen(false)} /> : null}
      </AnimatePresence>
    </header>
  );
}

function MobileDrawer({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Scrim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 modal-scrim"
        onClick={onClose}
      />

      {/* Panel — slides in from the right */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-canvas"
        style={{
          backgroundImage:
            "radial-gradient(circle at 90% -10%, rgba(255,195,120,0.28), transparent 40%), radial-gradient(circle at 10% 110%, rgba(230,0,35,0.05), transparent 35%)"
        }}
      >
        {/* Slow-rotating decorative sun, top-right */}
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(255,195,120,0.55), rgba(230,0,35,0.18), rgba(255,195,120,0.55))"
          }}
        />
        {/* Faint serif sun glyph */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-6 -left-6 font-serif text-[180px] italic leading-none text-brand/10"
        >
          ☼
        </span>

        {/* Header bar */}
        <div className="relative z-10 flex h-16 items-center justify-between px-5">
          <Link href="/" onClick={onClose} className="flex items-center">
            <Image src="/camob_logo.svg" alt="Camob Residence" width={100} height={100} className="w-24" />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-card text-ink shadow-ambient"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="relative z-10 mt-2 px-6 font-serif text-sm italic text-mute"
        >
          — where would you like to go?
        </motion.p>

        {/* Nav items — staggered */}
        <nav className="relative z-10 mt-4 flex flex-col gap-1 px-5">
          {links.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.22 + i * 0.08, type: "spring", damping: 22, stiffness: 200 }}
            >
              <Link
                href={link.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between rounded-md px-4 py-5 transition-colors",
                  isActive(link.href)
                    ? "bg-surface-card"
                    : "hover:bg-surface-card/70"
                )}
              >
                <span
                  className={cn(
                    "font-serif text-[40px] leading-none tracking-tight",
                    isActive(link.href) ? "italic text-brand" : "text-ink"
                  )}
                  style={{ letterSpacing: "-1.4px" }}
                >
                  {link.label}
                </span>
                <ArrowRight className="h-6 w-6 text-mute transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Postcard preview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative z-10 mx-5 mt-8"
        >
          <div className="polaroid rounded-md" style={{ transform: "rotate(-2.5deg)" }}>
            <div className="relative aspect-[5/4] overflow-hidden rounded-sm">
              <Image
                src={apartmentTypes[1].gallery[0]}
                alt="Inside one of the maisonettes"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <p className="mt-2 px-1 font-serif text-sm italic text-charcoal">
              the living room — downstairs
            </p>
          </div>
        </motion.div>

        {/* Footer block — CTA + address */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative z-10 mt-auto px-5 pb-8 pt-6"
        >
          <Link
            href="/book"
            onClick={onClose}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-bold text-white shadow-ambient transition-transform active:scale-[0.98]"
          >
            Reserve a stay
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href={siteCopy.whatsapp}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full bg-surface-card text-sm font-bold text-ink"
          >
            Or ask us on WhatsApp
          </a>
          <div className="mt-6 flex items-center gap-2 font-serif text-sm italic text-mute">
            <MapPin className="h-4 w-4" />
            {siteCopy.address}
          </div>
        </motion.div>
      </motion.aside>
    </motion.div>
  );
}
