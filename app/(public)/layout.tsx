import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsappFab } from "@/components/layout/whatsapp-fab";
import { ResumeBookingPill } from "@/components/booking/resume-booking-pill";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <WhatsappFab />
      <ResumeBookingPill />
      <SiteFooter />
    </div>
  );
}
