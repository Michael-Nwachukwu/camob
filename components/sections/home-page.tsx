import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Wifi, Zap } from "lucide-react";
import { apartmentTypes, attractions, faqItems, siteCopy } from "@/lib/data/camob";
import { formatCurrency } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";
import { HomeQuickBooking } from "@/components/sections/home-quick-booking";

export function HomePage() {
  return (
    <div className="pb-20">
      <section className="relative flex min-h-[850px] items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={siteCopy.heroImage}
            alt="Camob Residence living area"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center text-white">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-secondary-fixed backdrop-blur">
            Editorial shortlet living
          </div>
          <h1 className="mt-8 font-serif text-5xl leading-[1.02] md:text-7xl">Experience Comfort and Convenience</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/90">
            Beautifully designed short-stay apartments in Lekki, Lagos.
          </p>
        </div>
      </section>

      <HomeQuickBooking />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-20">
        <div className="grid gap-12 xl:gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Residence"
              title="Experience comfort, calm, and beautifully designed stays in Lekki."
              description={siteCopy.description}
            />
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book" className="rounded-full bg-silk px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20">
                Check Availability
              </Link>
              <Link
                href="/explore"
                className="rounded-full border border-outline bg-white px-6 py-3 font-semibold text-primary"
              >
                Explore the Neighborhood
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Zap, label: "24/7 Power Supply" },
                { icon: Wifi, label: "High-Speed Internet" },
                { icon: ShieldCheck, label: "Secure Peaceful Setting" }
              ].map((item) => (
                <div key={item.label} className="rounded-3xl bg-white/90 p-5 shadow-ambient">
                  <item.icon className="h-5 w-5 text-secondary" />
                  <p className="mt-3 text-sm font-semibold text-primary">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] shadow-ambient">
              <Image src={apartmentTypes[1].gallery[0]} alt="Camob Residence apartment preview" fill className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 to-transparent p-8 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Featured Stay</p>
                <h3 className="mt-3 font-serif text-3xl">2-Bedroom Executive Suite</h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-white/80">
                  Spacious interiors, modern finishes, and a stay rhythm that works for both families and premium work trips.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] bg-white p-8 shadow-ambient">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Location</p>
                <h3 className="mt-3 font-serif text-3xl text-primary">Ogombo, Lekki Scheme 2</h3>
                <p className="mt-4 text-sm leading-7 text-muted">
                  1 minute from British Charter School and around 20 minutes to Victoria Island via the coastal road.
                </p>
                <p className="mt-8 text-sm font-semibold text-primary">Peaceful residential access</p>
              </div>
              <div className="rounded-[2rem] bg-surface-low p-8">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Booking</p>
                <h3 className="mt-3 font-serif text-3xl text-primary">Instant holds, cleaner checkout</h3>
                <p className="mt-4 text-sm leading-7 text-muted">
                  Choose your unit type, see live date availability, hold your dates for 15 minutes, then pay with Paystack or reserve by transfer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <SectionHeading
          eyebrow="The Collection"
          title="Two apartment categories, four physical units, one polished stay standard."
          description="Each apartment type has two real units behind it, so availability is handled with proper inventory instead of a fake brochure calendar."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {apartmentTypes.map((apartment) => (
            <article key={apartment.id} className="overflow-hidden rounded-[2rem] bg-white shadow-ambient">
              <div className="relative h-80">
                <Image src={apartment.heroImage} alt={apartment.name} fill className="object-cover" />
              </div>
              <div className="p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="font-serif text-3xl text-primary">{apartment.name}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{apartment.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-secondary">{formatCurrency(apartment.ratePerNight)}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Per night</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {apartment.amenities.slice(0, 4).map((amenity) => (
                    <span key={amenity} className="rounded-full bg-surface-low px-4 py-2 text-xs font-semibold text-primary">
                      {amenity}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex gap-4">
                  <Link href={`/apartments/${apartment.slug}`} className="font-semibold text-primary underline decoration-secondary underline-offset-4">
                    View apartment details
                  </Link>
                  <Link href={`/book?apartmentTypeId=${apartment.id}`} className="font-semibold text-secondary">
                    Book this unit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface-low py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow="The Neighborhood"
            title="A short stay that puts Lagos within easy reach."
            description="Beaches, shopping, nature, schools, and leisure destinations sit around the residence without sacrificing the calmer pace of Ogombo."
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative h-64 overflow-hidden rounded-[1.5rem] shadow-ambient">
                <Image src={siteCopy.neighborhoodImages[0]} alt="Landmark Beach" fill className="object-cover" />
              </div>
              <div className="relative h-80 overflow-hidden rounded-[1.5rem] shadow-ambient">
                <Image src={siteCopy.neighborhoodImages[1]} alt="Lekki Conservation Centre" fill className="object-cover" />
              </div>
            </div>
            <div className="pt-12">
              <div className="relative h-full min-h-[28rem] overflow-hidden rounded-[1.5rem] shadow-ambient">
                <Image src={siteCopy.neighborhoodImages[2]} alt="Lagos nightlife" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 grid max-w-7xl gap-6 px-6 md:grid-cols-3">
          {attractions.slice(0, 3).map((attraction) => (
            <article key={attraction.id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-ambient">
              <div className="relative h-56">
                <Image src={attraction.image} alt={attraction.name} fill className="object-cover" />
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{attraction.category}</p>
                <h3 className="mt-3 font-serif text-2xl text-primary">{attraction.name}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{attraction.description}</p>
                <Link href="/explore" className="mt-4 inline-flex items-center gap-2 font-semibold text-primary">
                  Explore more <ArrowRight className="h-4 w-4 text-secondary" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] bg-primary p-10 text-white shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Booking Engine</p>
            <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight">Built for real availability, holds, and payment transitions.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Live calendar status per apartment type",
                "15-minute reservation hold before payment",
                "Paystack initiation and webhook confirmation",
                "Bank transfer fallback with staff review",
                "Admin blackout dates and rate overrides",
                "Guest and staff notification hooks"
              ].map((feature) => (
                <div key={feature} className="rounded-3xl bg-white/10 p-4 text-sm text-white/90">
                  <Sparkles className="mb-3 h-4 w-4 text-secondary-fixed" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-10 shadow-ambient">
            <SectionHeading
              eyebrow="FAQ"
              title="Planning your stay"
              description="A few details guests usually want before completing a reservation."
            />
            <div className="mt-8 space-y-5">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-3xl bg-surface-low p-5">
                  <h3 className="font-semibold text-primary">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
