// Probes each free chat-completion provider to find which are already enabled
// on the user's account, so we can pick one for the smoke test without
// requiring dashboard changes. Each call is free (provider passthrough).
import { env } from "@/lib/env";

const PROVIDERS = [
  { service: "anthropic_chat_completions", model: "claude-haiku-4-5-20251001" },
  { service: "openai_chat", model: "gpt-4o-mini" },
  { service: "openrouter_chat", model: "anthropic/claude-3.5-haiku" },
  { service: "groq_groq_chat", model: "llama-3.1-8b-instant" },
  { service: "mistral_mistral_chat", model: "mistral-small-latest" },
  { service: "grok_grok_chat", model: "grok-2-1212" },
  { service: "deepseek_deepseek_chat", model: "deepseek-chat" },
  { service: "perplexity_perplexity_chat", model: "sonar" }
];

async function probe(service: string, model: string) {
  const res = await fetch(`${env.argensBaseUrl}/marketplace/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.argensApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      service_id: service,
      payload: {
        model,
        messages: [{ role: "user", content: "Say 'ok' in one word." }],
        max_tokens: 10
      }
    })
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { result?: { choices?: Array<{ message?: { content?: string } }> } };
    error?: string;
    code?: string;
  } | null;

  if (res.ok && body?.data?.result?.choices?.[0]?.message?.content) {
    const text = body.data.result.choices[0].message.content.trim();
    console.log(`  ✓ ${service.padEnd(34)}  → "${text.slice(0, 60)}"`);
    return true;
  }
  const reason = body?.error ?? `HTTP ${res.status}`;
  const code = body?.code ?? "?";
  console.log(`  ✗ ${service.padEnd(34)}  → [${code}] ${reason.slice(0, 80)}`);
  return false;
}

async function main() {
  console.log(`Probing ${PROVIDERS.length} free chat providers…\n`);
  for (const p of PROVIDERS) await probe(p.service, p.model);
}

main();
