import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plug, Wifi, ShieldCheck, KeyRound, Snowflake, Tv } from "lucide-react";
import { apartmentTypes, attractions, faqItems, siteCopy } from "@/lib/data/camob";
import { formatCurrency } from "@/lib/utils";
import { HomeHero } from "@/components/sections/home-hero";
import { HomeQuickBooking } from "@/components/sections/home-quick-booking";
import { Reveal, TiltHover } from "@/components/ui/reveal";

export function HomePage() {
  return (
    <div className="pb-16">
      <HomeHero />

      <HomeQuickBooking />

      {/* What you actually get */}
      <section className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-serif text-sm italic text-mute">— the things that should already work</p>
              <h2 className="mt-2 max-w-2xl font-serif text-[34px] leading-[1.1] text-ink md:text-[48px]" style={{ letterSpacing: "-1px" }}>
                The basics, working.
              </h2>
            </div>
            <p className="max-w-sm text-sm text-body md:text-base">
              No flickering lights at 11pm. No "is the wifi working today?". This is the boring foundation a good stay actually needs.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Plug, label: "24/7 power", note: "Generator + inverter handle the grid's mood swings." },
            { icon: Wifi, label: "Fast Wi-Fi", note: "Backed up so the meeting doesn't drop." },
            { icon: KeyRound, label: "Private entrance", note: "Your own front door from the street." },
            { icon: Snowflake, label: "Air conditioning", note: "Every room. Even on the worst Lagos afternoons." },
            { icon: Tv, label: "Smart TV", note: "Netflix, YouTube, DSTV Premium — all signed in." },
            { icon: ShieldCheck, label: "Gated + CCTV", note: "Compound watched, cars parked off the street." }
          ].map((f, i) => (
            <Reveal key={f.label} delay={i * 0.06}>
              <TiltHover rotate={0.6}>
                <div className="rounded-md bg-canvas p-6 shadow-ambient transition-shadow hover:shadow-scrim">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink">
                    <f.icon className="h-5 w-5 text-brand" />
                  </span>
                  <p className="mt-5 font-serif text-xl text-ink">{f.label}</p>
                  <p className="mt-1.5 text-sm leading-[1.6] text-mute">{f.note}</p>
                </div>
              </TiltHover>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The two maisonettes */}
      <section id="stays" className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <Reveal>
          <p className="font-serif text-sm italic text-mute">— what's on offer</p>
          <h2 className="mt-2 max-w-3xl font-serif text-[34px] leading-[1.05] text-ink md:text-[52px]" style={{ letterSpacing: "-1.2px" }}>
            Same compound. <span className="italic text-brand">Two</span> layouts.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-[1.6] text-body md:text-lg">{siteCopy.longPitch}</p>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {apartmentTypes.map((apartment, i) => (
            <Reveal key={apartment.id} delay={i * 0.1}>
              <TiltHover rotate={i % 2 === 0 ? 0.6 : -0.6}>
                <article className="overflow-hidden rounded-md bg-canvas shadow-ambient">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={apartment.heroImage}
                      alt={apartment.name}
                      fill
                      className="object-cover transition-transform duration-[800ms] ease-out hover:scale-105"
                      sizes="(min-width:1024px) 50vw, 100vw"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink shadow-ambient">
                      {apartment.bedrooms} bed · sleeps {apartment.maxGuests}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-ambient">
                      {formatCurrency(apartment.ratePerNight)} / night
                    </span>
                  </div>
                  <div className="p-7 md:p-8">
                    <h3 className="font-serif text-2xl text-ink md:text-3xl" style={{ letterSpacing: "-0.4px" }}>
                      {apartment.name}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.7] text-body md:text-base">{apartment.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {apartment.amenities.slice(0, 5).map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-surface-card px-3 py-1.5 text-xs font-semibold text-ink"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center gap-4 text-sm font-semibold">
                      <Link
                        href={`/apartments/${apartment.slug}`}
                        className="inline-flex items-center gap-1 font-serif italic text-ink-soft underline decoration-brand decoration-2 underline-offset-4"
                      >
                        See the rooms
                      </Link>
                      <Link
                        href={`/book?apartmentTypeId=${apartment.id}`}
                        className="group inline-flex items-center gap-1 text-brand"
                      >
                        Check dates
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </TiltHover>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Discounts ribbon */}
      <section className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-lg bg-canvas p-8 shadow-ambient md:p-12">
            <div className="absolute -right-12 -top-12 h-48 w-48 animate-spin-slow rounded-full bg-brand/10" aria-hidden />
            <div className="relative md:flex md:items-center md:justify-between">
              <div>
                <p className="font-serif text-sm italic text-mute">— the longer you stay</p>
                <h3 className="mt-2 max-w-md font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
                  Stay longer. Pay <span className="italic text-brand">less</span>.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-[1.6] text-body md:text-base">
                  Discounts apply at checkout. No codes, no fine print.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
                {siteCopy.stayPolicies.discounts.map((d) => (
                  <div key={d.stay} className="animate-float rounded-lg bg-surface-card px-5 py-4 shadow-ambient" style={{ animationDuration: "8s" }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{d.stay}</p>
                    <p className="mt-1 font-serif text-2xl text-ink">{d.off}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Neighbourhood masonry */}
      <section className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-serif text-sm italic text-mute">— around here</p>
              <h2 className="mt-2 max-w-2xl font-serif text-[34px] leading-[1.05] text-ink md:text-[52px]" style={{ letterSpacing: "-1.2px" }}>
                Beaches, the school run, and the expressway — all <span className="italic">short</span>.
              </h2>
            </div>
            <Link href="/explore" className="hidden md:inline-flex items-center gap-1 font-serif italic text-ink-soft">
              All the notes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="masonry mt-10">
          {attractions.slice(0, 6).map((a, i) => (
            <Reveal key={a.id} delay={i * 0.05}>
              <TiltHover rotate={i % 2 === 0 ? 0.8 : -0.8}>
                <div className="overflow-hidden rounded-md bg-canvas shadow-ambient">
                  <div className="relative">
                    <Image
                      src={a.image}
                      alt={a.name}
                      width={600}
                      height={a.category === "Beach" ? 800 : 600}
                      className="h-auto w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink shadow-ambient">
                      {a.driveTime}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{a.category}</p>
                    <p className="mt-1 font-serif text-lg text-ink">{a.name}</p>
                  </div>
                </div>
              </TiltHover>
            </Reveal>
          ))}
        </div>
        <Link href="/explore" className="mt-6 inline-flex md:hidden items-center gap-1 font-serif italic text-ink-soft">
          All the notes <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Who it's for + FAQ */}
      <section className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-lg bg-canvas p-8 shadow-ambient">
              <span className="absolute -right-6 -top-6 font-serif text-[160px] leading-none text-brand/10">★</span>
              <p className="font-serif text-sm italic text-mute">— who tends to stay</p>
              <h3 className="mt-2 font-serif text-3xl text-ink" style={{ letterSpacing: "-0.6px" }}>
                Most guests are <span className="italic text-brand">one of these</span>
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-body md:text-base">
                {siteCopy.stayPolicies.idealFor.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-lg bg-canvas p-8 shadow-ambient">
              <p className="font-serif text-sm italic text-mute">— before you book</p>
              <h3 className="mt-2 font-serif text-3xl text-ink" style={{ letterSpacing: "-0.6px" }}>
                Honest answers, no script
              </h3>
              <div className="mt-6 divide-y divide-hairline-soft">
                {faqItems.map((item) => (
                  <details key={item.question} className="group py-4 first:pt-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-ink">
                      {item.question}
                      <span className="text-brand transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-sm leading-[1.7] text-body md:text-base">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto mt-24 max-w-7xl px-4 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-lg bg-surface-dark p-10 text-white md:p-16">
            <div className="absolute -left-20 -top-20 h-72 w-72 animate-spin-slow rounded-full opacity-20" aria-hidden style={{ background: "conic-gradient(from 0deg, #ffcc88, transparent, #ffcc88)" }} />
            <div className="absolute right-8 top-8 hidden font-serif text-7xl italic text-white/20 md:block">☼</div>
            <div className="relative z-10 max-w-2xl">
              <p className="font-serif text-sm italic text-stone">— {siteCopy.address}</p>
              <h2 className="mt-3 font-serif text-[36px] leading-[1.05] md:text-[60px]" style={{ letterSpacing: "-1.4px" }}>
                Pick your dates.
                <br />
                <span className="italic text-brand">We'll handle the rest.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-[1.65] text-stone">
                We hold the unit for 15 minutes while you fill in details. Pay with Paystack and it's confirmed; transfer and we'll review within a few hours.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-transform hover:-translate-y-0.5 hover:bg-brand-pressed"
                >
                  Check availability
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href={siteCopy.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center rounded-full bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/15"
                >
                  Ask on WhatsApp first
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
