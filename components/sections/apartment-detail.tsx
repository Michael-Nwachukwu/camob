import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, CalendarDays, MapPin, Users } from "lucide-react";
import { getSiteCopy } from "@/lib/services/repository";
import type { ApartmentTypeSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ApartmentDetail({ apartment }: { apartment: ApartmentTypeSummary }) {
  const site = getSiteCopy();

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-40">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] sm:col-span-2">
              <Image src={apartment.gallery[0]} alt={apartment.name} fill className="object-cover" />
            </div>
            {apartment.gallery.slice(1).map((image) => (
              <div key={image} className="relative min-h-64 overflow-hidden rounded-[1.75rem]">
                <Image src={image} alt={apartment.name} fill className="object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Premium Collection</p>
            <h1 className="mt-3 font-serif text-5xl text-primary">{apartment.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{apartment.longDescription ?? apartment.description}</p>

            <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-primary">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" /> {apartment.maxGuests} guests
              </span>
              <span className="inline-flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-secondary" /> {apartment.bedrooms} bedroom{apartment.bedrooms > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-2">
                <Bath className="h-4 w-4 text-secondary" /> {apartment.bathrooms} bathroom{apartment.bathrooms > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <section className="mt-12 rounded-[2rem] bg-surface-low p-8">
            <h2 className="font-serif text-3xl text-primary">What comes with the stay</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {apartment.amenities.map((amenity) => (
                <div key={amenity} className="rounded-3xl bg-white p-5 text-sm font-semibold text-primary shadow-ambient">
                  {amenity}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] bg-white p-8 shadow-ambient">
              <h2 className="font-serif text-2xl text-primary">House policies</h2>
              <div className="mt-5 space-y-4 text-sm text-muted">
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-secondary" /> Check-in from {site.checkIn}
                </p>
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-secondary" /> Check-out by {site.checkOut}
                </p>
                <p>No smoking in the apartments.</p>
                <p>No pets allowed on-site.</p>
              </div>
            </div>
            <div className="rounded-[2rem] bg-primary p-8 text-white shadow-ambient">
              <h2 className="font-serif text-2xl">Location</h2>
              <div className="relative mt-5 h-44 overflow-hidden rounded-[1.5rem]">
                <Image src={site.exploreMapImage} alt="Camob Residence map" fill className="object-cover" />
                <div className="absolute inset-0 bg-primary/25" />
              </div>
              <p className="mt-4 text-sm leading-7 text-white/80">{site.address}</p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary-fixed">
                <MapPin className="h-4 w-4" /> Directions and neighborhood highlights available
              </p>
              <a
                href={site.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary"
              >
                Open in Google Maps
              </a>
            </div>
          </section>
        </div>

        <aside className="lg:pt-12">
          <div className="sticky top-28 rounded-[2rem] bg-white p-8 shadow-ambient">
            <p className="text-3xl font-semibold text-secondary">{formatCurrency(apartment.ratePerNight)}</p>
            <p className="text-sm text-muted">per night</p>
            <div className="mt-8 space-y-4 rounded-[1.75rem] bg-surface-low p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Availability model</p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  This apartment type currently has {apartment.units} physical units. The booking calendar checks real remaining inventory before allowing checkout.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Payments</p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Complete your reservation with Paystack or choose manual bank transfer for staff review.
                </p>
              </div>
            </div>
            <Link href={`/book?apartmentTypeId=${apartment.id}`} className="mt-8 inline-flex w-full justify-center rounded-full bg-silk px-6 py-4 font-semibold text-white">
              Reserve this apartment
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
