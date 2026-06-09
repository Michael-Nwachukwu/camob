import { CopilotConsole } from "@/components/admin/copilot-console";

export const metadata = { title: "Co-pilot — Camob admin" };

export default function CopilotPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-serif text-sm italic text-mute">— operations</p>
        <h1 className="mt-1 font-serif text-3xl text-ink" style={{ letterSpacing: "-0.6px" }}>
          Co-pilot
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body">
          Drafts and digests, never actions. Every state change still goes through the usual admin pages —
          this just summarises and writes you a starting point.
        </p>
      </div>
      <CopilotConsole />
    </div>
  );
}
