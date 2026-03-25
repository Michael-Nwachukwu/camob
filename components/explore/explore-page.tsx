import Image from "next/image";
import { MapPin } from "lucide-react";
import { attractions, siteCopy } from "@/lib/data/camob";
import { SectionHeading } from "@/components/ui/section-heading";

export function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <section className="grid gap-10 py-16">
        <SectionHeading
          eyebrow="Neighborhood Guide"
          title="Beyond the residence, Lagos opens up quickly."
          description="Camob Residence gives guests a calmer home base while still keeping beaches, shopping, dining, and nature within easy reach."
        />

        <div className="rounded-[2rem] bg-primary p-8 text-white shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Map & Directions</p>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative min-h-[28rem] overflow-hidden rounded-[1.75rem]">
              <Image src={siteCopy.exploreMapImage} alt="Lekki map view" fill className="object-cover" />
              <div className="absolute inset-0 bg-primary/10" />
              <div className="absolute left-[68%] top-[58%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <div className="rounded-full border-4 border-white bg-primary p-3 shadow-xl">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="mt-2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  Camob Residence
                </span>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="rounded-[1.5rem] bg-white p-6 text-primary">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Residence Pin</p>
                <p className="mt-4 font-serif text-2xl">Camob Residence</p>
                <p className="mt-3 text-sm leading-7 text-muted">{siteCopy.address}</p>
                <a
                  href={siteCopy.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-surface-low px-4 py-2 text-sm font-semibold"
                >
                  <MapPin className="h-4 w-4 text-secondary" /> Open directions
                </a>
              </div>
              <div className="rounded-[1.5rem] bg-white/10 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Travel Notes</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-white/85">
                  <li>1 minute to British Charter School.</li>
                  <li>About 20 minutes to Victoria Island via the coastal road.</li>
                  <li>Practical access to malls, beaches, and leisure destinations.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-4">
        <div className="mb-8">
          <h2 className="font-serif text-4xl text-primary md:text-5xl">Signature Experiences</h2>
          <div className="mt-4 h-1 w-20 bg-secondary" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.68fr_0.68fr]">
          <article className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] shadow-ambient lg:min-h-[24rem]">
            <Image src={attractions[2].image} alt={attractions[2].name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-7 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Must Visit</p>
              <h3 className="mt-4 font-serif text-4xl">{attractions[2].name}</h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/85">{attractions[2].description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-6 text-xs font-semibold uppercase tracking-[0.25em] text-secondary-fixed">
                <span>{attractions[2].driveTime} drive</span>
                <span>Explore guide</span>
              </div>
            </div>
          </article>

          <article className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] shadow-ambient">
            <Image src={attractions[1].image} alt={attractions[1].name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h3 className="font-serif text-3xl">{attractions[1].name}</h3>
              <p className="mt-3 max-w-xs text-sm leading-7 text-white/85">{attractions[1].description}</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-secondary-fixed">
                {attractions[1].driveTime} drive
              </p>
            </div>
          </article>

          <div className="grid gap-4">
            {[attractions[3], attractions[6]].map((attraction) => (
              <article key={attraction.id} className="relative min-h-[10.5rem] overflow-hidden rounded-[1.75rem] shadow-ambient">
                <Image src={attraction.image} alt={attraction.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/25 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5 text-white">
                  <h3 className="font-serif text-2xl">{attraction.name}</h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-secondary-fixed">
                    {attraction.driveTime} drive
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {attractions.slice(0, 6).map((attraction) => (
          <article key={attraction.id} className="overflow-hidden rounded-[2rem] bg-white shadow-ambient">
            <div className="relative h-56">
              <Image src={attraction.image} alt={attraction.name} fill className="object-cover" />
            </div>
            <div className="p-7">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{attraction.category}</p>
              <h3 className="mt-4 font-serif text-3xl text-primary">{attraction.name}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{attraction.description}</p>
              <div className="mt-5 flex items-center justify-between text-sm font-semibold text-primary">
                <span>{attraction.distanceKm} km away</span>
                <span>{attraction.driveTime} drive</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
