// One-shot discovery script — lists matching providers + endpoint IDs for the
// three Camob agent use-cases (LLM chat, events search, agent mail). No spend.
//
// Run: npx tsx scripts/argens-discover.ts
import { env } from "@/lib/env";

async function listServices(search: string) {
  const url = new URL(`${env.argensBaseUrl}/marketplace/services`);
  url.searchParams.set("search", search);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.argensApiKey}` }
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`  [${search}] HTTP ${res.status}: ${body.slice(0, 300)}`);
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    console.error(`  [${search}] non-JSON: ${body.slice(0, 300)}`);
    return;
  }
  const providers =
    (parsed as { data?: { providers?: unknown[] } }).data?.providers ??
    (parsed as { data?: unknown[] }).data ??
    (parsed as { providers?: unknown[] }).providers ??
    parsed;
  console.log(`\n— search="${search}" —`);
  if (!Array.isArray(providers)) {
    console.log(`  (raw)`, JSON.stringify(parsed, null, 2).slice(0, 800));
    return;
  }
  for (const p of providers as Array<{
    id?: string;
    name?: string;
    description?: string;
    endpoints?: Array<{ id?: string; label?: string; method?: string; price?: string }>;
  }>) {
    console.log(`  • ${p.id} — ${p.name} (${p.description?.slice(0, 60) ?? ""})`);
    for (const ep of p.endpoints ?? []) {
      console.log(`      - ${ep.id}  [${ep.method}] ${ep.label ?? ""}  ${ep.price ?? ""}`);
    }
  }
}

async function main() {
  if (!env.argensApiKey) {
    console.error("ARGENS_API_KEY is unset.");
    process.exit(1);
  }
  console.log(`Base URL: ${env.argensBaseUrl}`);
  for (const term of ["llm", "chat", "claude", "anthropic", "events", "email", "mail", "agentmail"]) {
    await listServices(term);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
