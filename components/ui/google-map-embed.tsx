import { cn } from "@/lib/utils";

export function GoogleMapEmbed({
  query = "Ogombo Lekki Lagos",
  zoom = 14,
  className,
  title = "Camob Residence on Google Maps"
}: {
  query?: string;
  zoom?: number;
  className?: string;
  title?: string;
}) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;

  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn("h-full w-full border-0", className)}
      allowFullScreen
    />
  );
}
