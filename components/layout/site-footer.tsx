import Image from "next/image";
import Link from "next/link";
import { getSiteCopy } from "@/lib/services/repository";

export function SiteFooter() {
  const site = getSiteCopy();

  const groups = [
    {
      title: "Stay",
      links: [
        { href: "/apartments/one-bedroom-maisonette", label: "1-Bedroom Maisonette" },
        { href: "/apartments/two-bedroom-maisonette", label: "2-Bedroom Maisonette" },
        { href: "/book", label: "Check availability" }
      ]
    },
    {
      title: "Around here",
      links: [
        { href: "/explore", label: "Neighbourhood guide" },
        { href: site.googleMapsLink, label: "Directions", external: true },
        { href: site.whatsapp, label: "WhatsApp us", external: true }
      ]
    },
    {
      title: "Booking",
      links: [
        { href: "/book", label: "Live calendar" },
        { href: "/book", label: "Pay with Paystack" },
        { href: "/book", label: "Bank transfer" }
      ]
    },
    {
      title: "About",
      links: [
        { href: "#contact", label: "Contact" },
        { href: "#terms", label: "Terms" },
        { href: "#privacy", label: "Privacy" }
      ]
    }
  ];

  return (
    <footer id="contact" className="relative mt-20 border-t border-hairline bg-canvas/60 backdrop-blur">
      {/* Soft wash + sun ornament */}
      <span aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, rgba(255,195,120,0.6), transparent 70%)" }} />
      <span aria-hidden className="pointer-events-none absolute right-10 top-10 hidden font-serif text-7xl italic text-brand/15 md:block">☼</span>

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1.8fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image src="/camob_logo.svg" alt="Camob Residence" width={100} height={100} className="w-28" />
            </Link>
            <p className="mt-4 font-serif text-2xl italic text-ink md:text-3xl" style={{ letterSpacing: "-0.4px" }}>
              Two little houses, on a quiet street.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-[1.65] text-mute md:text-base">{site.description}</p>
            <p className="mt-6 font-serif text-sm italic text-ink-soft">{site.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="font-serif text-lg text-ink">{group.title}</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-mute">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="transition-colors hover:text-ink">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 md:flex-row md:items-center">
          <p className="font-serif text-xs italic text-mute">© {new Date().getFullYear()} Camob Residence. Run by humans, in Ogombo.</p>
          <div className="flex items-center gap-4 text-xs text-mute">
            <a href={site.whatsapp} target="_blank" rel="noreferrer" className="hover:text-ink">WhatsApp</a>
            <a href={`mailto:${site.conciergeEmail}`} className="hover:text-ink">{site.conciergeEmail}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
