"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink } from "lucide-react";
import { attractions, siteCopy } from "@/lib/data/camob";
import { GoogleMapEmbed } from "@/components/ui/google-map-embed";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Beach", "Nature", "Leisure", "Retail", "Culture", "Health"] as const;
type Cat = typeof CATEGORIES[number];

export function ExplorePage() {
  const [active, setActive] = useState<Cat>("All");

  const filtered = useMemo(() => {
    if (active === "All") return attractions;
    return attractions.filter((a) => a.category === active);
  }, [active]);

  return (
    <div className="relative pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="font-serif text-sm italic text-mute">— a guide, sort of</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[40px] leading-[1.02] text-ink md:text-[72px]" style={{ letterSpacing: "-1.4px" }}>
            The bit of Lekki you actually <span className="italic text-brand">live in</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-[1.65] text-body md:text-lg">
            Beaches under ten minutes. Charterhouse on foot. The expressway when
            you need it. We've left the touristy stuff for the listings that need it.
          </p>
        </motion.div>

        {/* Filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 flex flex-wrap gap-2"
        >
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setActive(cat)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                active === cat
                  ? "bg-brand text-canvas shadow-ambient"
                  : "bg-canvas text-ink shadow-ambient hover:bg-surface-card"
              )}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        {/* Map block */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 overflow-hidden rounded-lg bg-canvas shadow-ambient"
        >
          <div className="relative aspect-[21/8] bg-surface-card">
            <GoogleMapEmbed
              coords={{ lat: siteCopy.coordinates.latitude, lng: siteCopy.coordinates.longitude }}
              zoom={17}
              title="Camob Residence — exact location"
            />
            <a
              href={siteCopy.googleMapsLink}
              target="_blank"
              rel="noreferrer"
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink shadow-ambient hover:bg-surface-card"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
            </a>
          </div>
          <div className="grid gap-4 p-7 md:grid-cols-3 md:p-9">
            <div>
              <p className="font-serif text-sm italic text-mute">— address</p>
              <p className="mt-1.5 font-serif text-lg text-ink">{siteCopy.address}</p>
            </div>
            <div>
              <p className="font-serif text-sm italic text-mute">— to VI</p>
              <p className="mt-1.5 font-serif text-lg text-ink">~15 min via the coastal road</p>
            </div>
            <div>
              <p className="font-serif text-sm italic text-mute">— school run</p>
              <p className="mt-1.5 font-serif text-lg text-ink">1 min to Charterhouse</p>
            </div>
          </div>
        </motion.div>

        {/* Masonry */}
        <AnimatePresence mode="popLayout">
          <motion.div key={active} className="masonry mt-12">
            {filtered.map((a, i) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                whileHover={{ y: -4, rotate: i % 2 === 0 ? 0.6 : -0.6 }}
                className="overflow-hidden rounded-md bg-canvas shadow-ambient"
              >
                <div className="relative">
                  <Image
                    src={a.image}
                    alt={a.name}
                    width={600}
                    height={a.category === "Beach" ? 720 : 540}
                    className="h-auto w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-canvas px-3 py-1.5 font-serif text-xs italic text-ink shadow-ambient">
                    {a.driveTime}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{a.category}</p>
                  <h3 className="mt-1.5 font-serif text-xl text-ink">{a.name}</h3>
                  <p className="mt-2 text-sm leading-[1.65] text-body">{a.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-mute">
                      {a.distanceKm ? `${a.distanceKm} km · ` : ""}{a.driveTime}
                    </p>
                    {a.mapUrl ? (
                      <a
                        href={a.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                      >
                        Map <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-mute">
            Nothing in that category yet. Try another filter.
          </p>
        ) : null}

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 rounded-lg bg-canvas p-10 text-center shadow-ambient"
        >
          <h2 className="font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
            Sold on the <span className="italic text-brand">neighbourhood</span>?
          </h2>
          <p className="mt-3 text-base text-body">The maisonettes are the easy part.</p>
          <Link
            href="/book"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-transform hover:-translate-y-0.5 hover:bg-brand-pressed"
          >
            Check availability
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
