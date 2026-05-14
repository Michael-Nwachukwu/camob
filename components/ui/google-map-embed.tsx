import { cn } from "@/lib/utils";

interface GoogleMapEmbedProps {
  query?: string;
  coords?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  title?: string;
}

export function GoogleMapEmbed({
  query = "Ogombo Lekki Lagos",
  coords,
  zoom = 17,
  className,
  title = "Camob Residence on Google Maps"
}: GoogleMapEmbedProps) {
  // When coords are passed, q=<lat>,<lng> drops a precise red pin
  // at that exact spot. Otherwise we fall back to a place query.
  const q = coords ? `${coords.lat},${coords.lng}` : query;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;

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
