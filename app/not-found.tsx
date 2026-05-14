import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4 md:px-6">
      <div className="max-w-xl rounded-lg bg-canvas p-10 text-center md:p-12">
        <p className="font-serif text-sm italic text-mute">— 404</p>
        <h1 className="mt-3 font-serif text-[36px] leading-[1.05] text-ink md:text-[56px]" style={{ letterSpacing: "-1.2px" }}>
          Couldn't find <span className="italic text-brand">that one</span>.
        </h1>
        <p className="mt-4 text-base leading-[1.6] text-body">
          The page might have moved, or the link is older than we are. The good
          stuff is still where you left it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-md bg-brand px-5 text-sm font-bold text-white hover:bg-brand-pressed"
          >
            Back to home
          </Link>
          <Link
            href="/book"
            className="inline-flex h-12 items-center rounded-md bg-surface-card px-5 text-sm font-bold text-ink hover:bg-surface-deep"
          >
            See availability
          </Link>
        </div>
      </div>
    </div>
  );
}
