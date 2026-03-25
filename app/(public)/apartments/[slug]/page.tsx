import { notFound } from "next/navigation";
import { ApartmentDetail } from "@/components/sections/apartment-detail";
import { getApartmentTypeBySlug } from "@/lib/services/repository";

export default async function ApartmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apartment = getApartmentTypeBySlug(slug);

  if (!apartment) {
    notFound();
  }

  return <ApartmentDetail apartment={apartment} />;
}
