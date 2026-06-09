// One-shot smoke test against the live argens API.
// Run: ARGENS_BASE_URL=https://api.argens.xyz/v1 npx tsx scripts/argens-smoke.ts
import { argensChat, ArgensError } from "@/lib/services/argens";
import { env } from "@/lib/env";

async function main() {
  if (!env.argensApiKey) {
    console.error("ARGENS_API_KEY is unset.");
    process.exit(1);
  }

  console.log(`Base URL: ${env.argensBaseUrl}`);
  console.log(`LLM service: ${env.argensLlmService}  model: ${env.argensLlmModel}\n`);

  try {
    const reply = await argensChat({
      agent: "concierge",
      system: "You are a friendly hospitality concierge. Reply in one short sentence.",
      messages: [{ role: "user", content: "What's a maisonette in one sentence?" }],
      maxTokens: 80
    });
    console.log("✓ LLM reply:");
    console.log(`  "${reply}"`);
  } catch (e) {
    if (e instanceof ArgensError) {
      console.error(`✗ ArgensError [${e.kind}]: ${e.message}`);
      console.error("  detail:", JSON.stringify(e.detail, null, 2).slice(0, 600));
    } else {
      console.error("✗ unexpected:", e);
    }
    process.exit(2);
  }
}

main();
