import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-surface px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-ambient md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Admin Console</p>
            <h1 className="mt-2 font-serif text-3xl text-primary">Camob Operations</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin" className="rounded-full border border-outline px-4 py-2 text-sm font-semibold text-primary">
              Overview
            </Link>
            <Link href="/admin/bookings" className="rounded-full border border-outline px-4 py-2 text-sm font-semibold text-primary">
              Bookings
            </Link>
            <Link href="/admin/calendar" className="rounded-full border border-outline px-4 py-2 text-sm font-semibold text-primary">
              Calendar
            </Link>
            <Link href="/admin/units" className="rounded-full border border-outline px-4 py-2 text-sm font-semibold text-primary">
              Units
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/sign-in" });
              }}
            >
              <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                Sign out {session?.user?.email ? `(${session.user.email})` : ""}
              </button>
            </form>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
