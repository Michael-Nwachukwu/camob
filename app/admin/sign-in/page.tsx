import { signIn } from "@/auth";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/admin"
          });
        }}
        className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-ambient"
      >
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Staff Access</p>
        <h1 className="mt-3 font-serif text-4xl text-primary">Sign in to Camob admin.</h1>
        <div className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Email</label>
            <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-outline bg-surface-low px-4 py-3" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-outline bg-surface-low px-4 py-3"
            />
          </div>
        </div>
        <button className="mt-8 w-full rounded-full bg-silk px-6 py-3 font-semibold text-white">Sign in</button>
      </form>
    </div>
  );
}
