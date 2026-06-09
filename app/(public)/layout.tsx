import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ConciergeLauncher } from "@/components/concierge/concierge-launcher";
import { ResumeBookingPill } from "@/components/booking/resume-booking-pill";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <ConciergeLauncher />
      <ResumeBookingPill />
      <SiteFooter />
    </div>
  );
}
