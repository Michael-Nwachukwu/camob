import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate. Even if middleware ever misses a path, no admin page
  // renders without a session. The sign-in page lives outside this group,
  // so there's no redirect loop.
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/sign-in");
  }

  return (
    <div className="min-h-screen bg-surface-soft pb-16 pt-4 md:pt-6">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <header className="rounded-lg bg-canvas p-5 shadow-ambient md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <Image src="/camob_logo.svg" alt="Camob Residence" width={80} height={80} className="w-20" />
              <span className="hidden sm:block">
                <p className="font-serif text-sm italic text-mute">— staff only</p>
                <p className="font-serif text-lg text-ink md:text-xl" style={{ letterSpacing: "-0.3px" }}>
                  Operations
                </p>
              </span>
            </Link>

            <AdminNav />

            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex h-10 items-center rounded-full bg-surface-card px-4 text-sm font-semibold text-ink hover:bg-surface-deep"
              >
                Live site ↗
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/admin/sign-in" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-canvas hover:bg-ink-soft"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <p className="mt-4 font-serif text-xs italic text-mute md:mt-3">
            signed in as <span className="text-ink">{session.user.email}</span>
          </p>
        </header>

        <main className="mt-6 md:mt-8">{children}</main>
      </div>
    </div>
  );
}
