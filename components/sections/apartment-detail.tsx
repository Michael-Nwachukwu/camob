import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, CalendarDays, Home as HomeIcon, MapPin, Users, ArrowRight, Check } from "lucide-react";
import { getSiteCopy } from "@/lib/services/repository";
import type { ApartmentTypeSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { siteCopy } from "@/lib/data/camob";
import { Reveal, TiltHover } from "@/components/ui/reveal";
import { GoogleMapEmbed } from "@/components/ui/google-map-embed";

export function ApartmentDetail({ apartment }: { apartment: ApartmentTypeSummary }) {
  const site = getSiteCopy();
  const isOneBed = apartment.id === "one-bedroom";

  return (
    <div className="relative pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Link href="/" className="font-serif text-sm italic text-mute hover:text-ink">
          ← Both maisonettes
        </Link>
        <Reveal>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-serif text-sm italic text-mute">
                {apartment.bedrooms} bed · sleeps {apartment.maxGuests} · Ogombo, Lekki
              </p>
              <h1 className="mt-3 max-w-3xl font-serif text-[40px] leading-[1.02] text-ink md:text-[72px]" style={{ letterSpacing: "-1.6px" }}>
                {apartment.name.split(" Maisonette")[0]}{" "}
                <span className="italic text-brand">Maisonette</span>
              </h1>
            </div>
            <Link
              href={`/book?apartmentTypeId=${apartment.id}`}
              className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-transform hover:-translate-y-0.5 hover:bg-brand-pressed"
            >
              Check dates
            </Link>
          </div>
        </Reveal>

        {/* Gallery */}
        <div className="mt-10 grid grid-cols-6 gap-2 md:gap-3">
          <Reveal className="col-span-6 md:col-span-4 md:row-span-2">
            <TiltHover rotate={0.4}>
              <div className="relative aspect-[16/10] overflow-hidden rounded-md shadow-ambient">
                <Image src={apartment.gallery[0]} alt={apartment.name} fill priority className="object-cover" sizes="(min-width:768px) 66vw, 100vw" />
              </div>
            </TiltHover>
          </Reveal>
          {apartment.gallery.slice(1, 5).map((image, i) => (
            <Reveal key={image} delay={0.1 + i * 0.08} className={`col-span-3 md:col-span-2 ${i > 1 ? "hidden md:block" : ""}`}>
              <TiltHover rotate={i % 2 === 0 ? 0.6 : -0.6}>
                <div className="relative aspect-square overflow-hidden rounded-md shadow-ambient">
                  <Image src={image} alt={apartment.name} fill className="object-cover" sizes="(min-width:768px) 33vw, 50vw" />
                </div>
              </TiltHover>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-14 grid max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          {/* Quick facts strip */}
          <Reveal>
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-y border-hairline py-5 font-serif text-base text-ink">
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-mute" /> {apartment.maxGuests} guests</span>
              <span className="inline-flex items-center gap-2"><BedDouble className="h-4 w-4 text-mute" /> {apartment.bedrooms} bedroom{apartment.bedrooms > 1 ? "s" : ""}</span>
              <span className="inline-flex items-center gap-2"><Bath className="h-4 w-4 text-mute" /> {apartment.bathrooms} bathroom{apartment.bathrooms > 1 ? "s" : ""}</span>
              <span className="inline-flex items-center gap-2"><HomeIcon className="h-4 w-4 text-mute" /> two floors, private entrance</span>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-12">
              <p className="font-serif text-sm italic text-mute">— what you walk into</p>
              <h2 className="mt-2 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.8px" }}>
                A small house, inside a building.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-[1.75] text-body md:text-lg">
                {apartment.longDescription ?? apartment.description}
              </p>
            </div>
          </Reveal>

          {/* Floor-by-floor */}
          <section className="mt-12 grid gap-4 sm:grid-cols-2">
            <Reveal>
              <TiltHover rotate={0.6}>
                <div className="relative h-full overflow-hidden rounded-lg bg-canvas p-7 shadow-ambient">
                  <span className="absolute -right-4 -top-4 font-serif text-[120px] leading-none text-brand/10">1</span>
                  <p className="font-serif text-sm italic text-mute">— downstairs</p>
                  <h3 className="mt-2 font-serif text-2xl text-ink">Where the day happens</h3>
                  <ul className="mt-5 space-y-2.5 text-sm text-body md:text-base">
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Fully furnished living area</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Fully equipped kitchen</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Guest toilet — visitors don't go upstairs</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Smart TV, work-friendly desk</li>
                  </ul>
                </div>
              </TiltHover>
            </Reveal>
            <Reveal delay={0.1}>
              <TiltHover rotate={-0.6}>
                <div className="relative h-full overflow-hidden rounded-lg bg-canvas p-7 shadow-ambient">
                  <span className="absolute -right-4 -top-4 font-serif text-[120px] leading-none text-brand/10">2</span>
                  <p className="font-serif text-sm italic text-mute">— upstairs</p>
                  <h3 className="mt-2 font-serif text-2xl text-ink">
                    {isOneBed ? "One ensuite bedroom" : "Two ensuite bedrooms"}
                  </h3>
                  <ul className="mt-5 space-y-2.5 text-sm text-body md:text-base">
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Premium bedding</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Ensuite bathroom{isOneBed ? "" : "s"}</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Air conditioning, properly cold</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" /> Set back from the street, quiet</li>
                  </ul>
                </div>
              </TiltHover>
            </Reveal>
          </section>

          {/* Amenities */}
          <Reveal>
            <section className="mt-12">
              <p className="font-serif text-sm italic text-mute">— and the rest</p>
              <h2 className="mt-2 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.8px" }}>
                What comes with it
              </h2>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {apartment.amenities.map((amenity, i) => (
                  <div
                    key={amenity}
                    className="rounded-md bg-canvas px-4 py-3 text-sm font-semibold text-ink shadow-ambient"
                    style={{ animation: `fadeUp 0.5s ease ${i * 0.04}s both` }}
                  >
                    {amenity}
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* Clean / house notes */}
          <section className="mt-12 grid gap-4 md:grid-cols-2">
            <Reveal>
              <div className="rounded-lg bg-canvas p-7 shadow-ambient">
                <h3 className="font-serif text-xl text-ink">Clean and safe</h3>
                <p className="mt-3 text-sm leading-[1.7] text-body md:text-base">
                  Professional clean before every stay. Compound gated, CCTV
                  watching, cars parked behind the gate — not on the street.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-lg bg-canvas p-7 shadow-ambient">
                <h3 className="font-serif text-xl text-ink">House notes</h3>
                <div className="mt-3 space-y-2 text-sm text-body md:text-base">
                  <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-mute" /> Check-in from {site.checkIn}</p>
                  <p className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-mute" /> Out by {site.checkOut}</p>
                  <p>No smoking inside. No pets, sorry.</p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* Location */}
          <Reveal>
            <section className="mt-12 overflow-hidden rounded-lg bg-canvas shadow-ambient">
              <div className="relative aspect-[16/7] bg-surface-card">
                <GoogleMapEmbed query="Ogombo, Lekki Scheme 2, Lagos" zoom={14} />
              </div>
              <div className="p-7 md:p-9">
                <p className="font-serif text-sm italic text-mute">— where you'll be</p>
                <h3 className="mt-2 font-serif text-2xl text-ink">{site.address}</h3>
                <p className="mt-3 max-w-xl text-sm leading-[1.7] text-body md:text-base">
                  One minute to Charterhouse Lagos. About fifteen to Victoria
                  Island when the coastal road is kind. The beach axis — Barracuda,
                  Atican, Avista — is all under ten.
                </p>
                <a
                  href={site.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface-card px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-deep"
                >
                  <MapPin className="h-4 w-4" /> Open in Google Maps
                </a>
              </div>
            </section>
          </Reveal>
        </div>

        {/* Sticky booking card */}
        <aside>
          <div className="sticky top-24 rounded-lg bg-canvas p-7 shadow-scrim md:p-8">
            <div className="flex items-end gap-2">
              <p className="font-serif text-4xl text-ink">{formatCurrency(apartment.ratePerNight)}</p>
              <span className="pb-1.5 font-serif text-sm italic text-mute">/ night</span>
            </div>
            <p className="mt-1 text-xs text-mute">5+ nights: 5% off · Monthly: 7% off</p>

            <div className="mt-6 space-y-3">
              <Link
                href={`/book?apartmentTypeId=${apartment.id}`}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-pressed"
              >
                Check dates
              </Link>
              <a
                href={siteCopy.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-surface-card text-sm font-bold text-ink hover:bg-surface-deep"
              >
                Ask on WhatsApp
              </a>
            </div>

            <div className="mt-6 rounded-md bg-surface-card p-4 text-sm leading-[1.65] text-body">
              <p className="font-serif italic text-ink">How it works</p>
              <p className="mt-2">
                Pick dates, we hold the unit for 15 minutes. Pay with Paystack to
                confirm, or send a transfer and we'll review within a few hours.
              </p>
            </div>

            <Link
              href={`/apartments/${isOneBed ? "two-bedroom-maisonette" : "one-bedroom-maisonette"}`}
              className="mt-6 flex items-center justify-between rounded-md bg-surface-card p-4 text-sm font-semibold text-ink hover:bg-surface-deep"
            >
              <span className="font-serif italic">See the {isOneBed ? "2-bedroom" : "1-bedroom"} instead</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
