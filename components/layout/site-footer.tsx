import Image from "next/image";
import Link from "next/link";
import { getSiteCopy } from "@/lib/services/repository";

export function SiteFooter() {
  const site = getSiteCopy();

  const topLinks = [
    { href: "/book", label: "Platform" },
    { href: "/apartments/one-bedroom-urban-sanctuary", label: "Suites" },
    { href: "/explore", label: "Direct" },
    { href: "/book", label: "Bookings" },
    { href: "#concierge", label: "Info Hub" }
  ];

  const footerGroups = [
    {
      title: "Stay",
      links: [
        { href: "/apartments/one-bedroom-urban-sanctuary", label: "1-Bedroom" },
        { href: "/apartments/two-bedroom-executive-suite", label: "2-Bedroom" },
        { href: "/book", label: "Availability" }
      ]
    },
    {
      title: "Explore",
      links: [
        { href: "/explore", label: "Neighborhood Guide" },
        { href: site.googleMapsLink, label: "Directions", external: true },
        { href: site.whatsapp, label: "WhatsApp Concierge", external: true }
      ]
    },
    {
      title: "Guest Info",
      links: [
        { href: "/book", label: "Instant Booking" },
        { href: "/book", label: "Payment Options" },
        { href: "/book", label: "Availability Calendar" }
      ]
    },
    {
      title: "Social",
      links: [
        { href: "https://www.instagram.com", label: "Instagram", external: true },
        { href: "https://x.com", label: "Twitter", external: true },
        { href: "https://www.linkedin.com", label: "LinkedIn", external: true }
      ]
    },
    {
      title: "Company",
      links: [
        { href: "#concierge", label: "Open Roles" },
        { href: "#concierge", label: "Terms and Conditions" },
        { href: "#concierge", label: "Privacy Policy" }
      ]
    }
  ];

  return (
    <footer id="concierge" className="mt-24 bg-black px-4 pb-6 pt-16 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-t-[1.7rem] bg-[#171717] px-6 py-4 md:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/camob_logo.svg"
                alt="Camob Residence logo"
                width={150}
                height={42}
                className="h-auto w-32 brightness-0 invert"
              />
            </Link>

            <nav className="flex flex-wrap items-center gap-5 text-sm text-white/75 md:justify-center">
              {topLinks.map((link) => (
                <Link key={link.label} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/book"
              className="inline-flex w-fit rounded-full bg-[#67e8e3] px-5 py-3 text-sm font-semibold text-black transition-transform hover:scale-[0.98]"
            >
              Check Availability
            </Link>
          </div>
        </div>

        <div className="rounded-b-[1.7rem] bg-black px-6 py-12 md:px-10 md:py-14">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1.8fr]">
            <div>
              <h2 className="max-w-md font-serif text-5xl leading-none text-white md:text-7xl">Camob Residence</h2>
              <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">{site.description}</p>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-lg font-medium text-white">{group.title}</h3>
                  <ul className="mt-4 space-y-3 text-sm text-white/55">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        {link.external ? (
                          <a href={link.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className="transition-colors hover:text-white">
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

          <div className="mt-24 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3 md:items-end">
            <p className="text-sm text-white/45">
              Ogombo Town, Lekki Scheme 2, Lagos State, Nigeria
            </p>
            <p className="text-center font-serif text-3xl text-white md:text-4xl">Book. Pay. Stay.</p>
            <p className="text-sm text-white/45 md:text-right">Made for Camob Residence</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
