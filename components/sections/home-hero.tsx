"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { apartmentTypes, siteCopy } from "@/lib/data/camob";

const ticker = [
  // neighbourhood
  "Charterhouse · 1 min",
  "Barracuda Beach · 8 min",
  "Avista Beach · 5 min",
  "Atican Beach · 10 min",
  "Whitedeck pool · 12 min",
  "Victoria Island · 15 min",
  "Novare Mall · 10 min",
  "Lekki–Epe Expressway · 3 min",
  // the house itself
  "Two-storey maisonette",
  "Private entrance from the street",
  "Living + kitchen downstairs",
  "Ensuite bedrooms upstairs",
  "Guest toilet on the ground floor",
  // facilities
  "24/7 power · generator + inverter",
  "Fast Wi-Fi, backed up",
  "Air conditioning in every room",
  "Smart TV · Netflix · YouTube · DSTV",
  "Fully equipped kitchen",
  "Work-friendly desk setup",
  "Premium bedding",
  // safety + service
  "Gated compound · CCTV",
  "Professional clean before every stay",
  "Parking off the street",
  // pricing perks
  "From ₦95K / night",
  "5% off from five nights",
  "7% off on monthly stays",
  "Paystack or bank transfer"
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-sunwash pt-24 md:pt-28">
      {/* Decorative slow-spinning sun */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-40 md:opacity-60"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(255,195,120,0.55), rgba(230,0,35,0.18), rgba(255,195,120,0.55))"
        }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.4) 60deg, transparent 120deg, rgba(255,255,255,0.4) 180deg, transparent 240deg, rgba(255,255,255,0.4) 300deg, transparent 360deg)",
            mixBlendMode: "soft-light"
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24 mb-10 sm:mb-0">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          {/* Copy column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full bg-canvas/80 px-3 py-1.5 text-xs font-semibold text-charcoal shadow-ambient backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <MapPin className="h-3.5 w-3.5 text-mute" />
              Ogombo · Lekki Scheme 2, Lagos
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mt-5 font-serif text-[44px] leading-[1.02] text-ink md:text-[70px]"
              style={{ letterSpacing: "-1.8px" }}
            >
              Two little houses,
              <br />
              <span className="italic text-brand">
                <span className="brush-underline">a minute</span>
              </span>{" "}
              from Charterhouse.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 max-w-xl text-lg leading-[1.6] text-body"
            >
              Self-contained maisonettes with their own front door. Living and
              kitchen below, bedrooms ensuite upstairs. Quiet street, warm light,
              and everything in the building behaves the way it should.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/book"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-transform hover:-translate-y-0.5 hover:bg-brand-pressed"
              >
                Check available nights
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#stays"
                className="inline-flex h-12 items-center rounded-full bg-canvas px-6 text-sm font-bold text-ink shadow-ambient transition-transform hover:-translate-y-0.5"
              >
                Peek at the rooms
              </Link>
            </motion.div>

            {/* small stat row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-body"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                From <strong className="ml-1 text-ink">₦95K</strong> a night
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-serif text-2xl text-ink leading-none">★</span>
                Two units, two layouts
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-serif text-2xl text-ink leading-none">·</span>
                5% off from 5 nights
              </span>
            </motion.div>
          </div>

          {/* Photo collage column */}
          <div className="relative h-[480px] md:h-[560px]">
            {/* big polaroid */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              className="absolute left-2 top-4 w-[78%] md:left-0 md:w-[64%]"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="polaroid rounded-md"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
                  <Image
                    src={apartmentTypes[1].gallery[0]}
                    alt="Living area"
                    fill
                    priority
                    className="object-cover"
                    sizes="(min-width:768px) 36vw, 70vw"
                  />
                </div>
                <p className="mt-2 px-1 font-serif text-sm italic text-charcoal">
                  the living room — downstairs
                </p>
              </motion.div>
            </motion.div>

            {/* mid card */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 8 }}
              animate={{ opacity: 1, x: 0, rotate: 5 }}
              transition={{ duration: 0.9, delay: 0.45, ease: "easeOut" }}
              className="absolute right-0 top-12 w-[58%] md:w-[46%]"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="polaroid rounded-md"
              >
                <div className="relative aspect-square overflow-hidden rounded-sm">
                  <Image
                    src={apartmentTypes[0].gallery[1] ?? apartmentTypes[0].gallery[0]}
                    alt="Bedroom"
                    fill
                    className="object-cover"
                    sizes="(min-width:768px) 28vw, 50vw"
                  />
                </div>
                <p className="mt-2 px-1 font-serif text-sm italic text-charcoal">
                  bedroom · upstairs, ensuite
                </p>
              </motion.div>
            </motion.div>

            {/* small beach card */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -10 }}
              animate={{ opacity: 1, y: 0, rotate: -7 }}
              transition={{ duration: 0.9, delay: 0.7, ease: "easeOut" }}
              className="absolute bottom-2 left-8 w-[52%] md:w-[40%]"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="polaroid rounded-md"
              >
                <div className="relative aspect-[5/4] overflow-hidden rounded-sm">
                  <Image
                    src={siteCopy.neighborhoodImages[0]}
                    alt="Barracuda Beach nearby"
                    fill
                    className="object-cover"
                    sizes="(min-width:768px) 24vw, 50vw"
                  />
                </div>
                <p className="mt-2 px-1 font-serif text-sm italic text-charcoal">
                  Barracuda · 8 min in the car
                </p>
              </motion.div>
            </motion.div>

            {/* rotating price stamp */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.9, type: "spring", stiffness: 120 }}
              className="absolute -bottom-2 right-2 md:right-6"
            >
              <motion.div
                animate={{ rotate: [-4, 4, -4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-28 w-28 items-center justify-center rounded-full bg-brand text-center text-white shadow-ambient md:h-32 md:w-32"
              >
                <div>
                  <p className="font-serif text-xs italic">from</p>
                  <p className="font-serif text-2xl leading-none md:text-3xl">₦95k</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em]">/ night</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Marquee strip — continuous slider of selling points */}
      <div className="border-y border-hairline bg-canvas/70 backdrop-blur">
        <div className="marquee-mask overflow-hidden py-4">
          <div className="marquee-track" aria-hidden="false">
            {[...ticker, ...ticker].map((line, i) => (
              <span
                key={i}
                className="mx-8 inline-flex items-center gap-4 font-serif text-base italic text-charcoal md:text-lg"
              >
                <span>{line}</span>
                <span className="text-brand">✶</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
