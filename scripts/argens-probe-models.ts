// Try a few Anthropic model identifiers to find one argens accepts.
import { env } from "@/lib/env";

const MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-haiku-4-5",
  "claude-3-5-haiku-latest",
  "claude-3-5-haiku-20241022",
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20251022",
  "claude-3-5-sonnet-latest",
  "claude-3-5-sonnet-20241022",
  "claude-opus-4-7",
  "claude-3-haiku-20240307"
];

async function probe(model: string) {
  const res = await fetch(`${env.argensBaseUrl}/marketplace/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.argensApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      service_id: "anthropic_chat_completions",
      payload: {
        model,
        messages: [{ role: "user", content: "Say 'ok'." }],
        max_tokens: 10
      }
    })
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { result?: { choices?: Array<{ message?: { content?: string } }> } };
    error?: string;
    code?: string;
    details?: { message?: string };
  } | null;

  if (res.ok && body?.data?.result?.choices?.[0]?.message?.content) {
    console.log(`  ✓ ${model.padEnd(32)}  → "${body.data.result.choices[0].message.content.trim().slice(0, 50)}"`);
    return true;
  }
  const reason = body?.details?.message ?? body?.error ?? `HTTP ${res.status}`;
  const code = body?.code ?? "?";
  console.log(`  ✗ ${model.padEnd(32)}  → [${code}] ${reason.slice(0, 110)}`);
  return false;
}

async function main() {
  console.log("Probing Anthropic model identifiers…\n");
  for (const m of MODELS) await probe(m);
}

main();
