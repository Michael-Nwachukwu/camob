import { signIn } from "@/auth";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4 py-12 md:px-6">
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/admin"
          });
        }}
        className="w-full max-w-md rounded-lg bg-canvas p-8 md:p-10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Staff only</p>
        <h1 className="mt-3 text-[28px] font-bold leading-[1.1] text-ink tracking-display md:text-[36px]">
          Camob admin sign-in
        </h1>
        <p className="mt-3 text-sm text-body">
          Use your work email. If you've forgotten the password, ask the team — we still rotate them by hand.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1.5 h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1.5 h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>
        </div>

        <button className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-md bg-brand text-sm font-bold text-white hover:bg-brand-pressed">
          Sign in
        </button>
      </form>
    </div>
  );
}
