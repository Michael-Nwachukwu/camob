import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

// Argens — autonomous-payment rails for AI agents. All four Camob agents route
// their paid LLM / marketplace / agent-mail calls through this one client so we
// get unified policy enforcement, error shape, and an `AgentRun` audit row.
//
// The REST surface (`POST /marketplace/call` with `{service, input}`, response
// `{data | error}`) is per https://argens.xyz/SKILL.md. Exact service names
// (`llm.chat`, `events.search`, `agent-mail.send`) are configurable via env
// because the marketplace catalogue may evolve.

export type AgentName = "concierge" | "itinerary" | "copilot" | "weekly-brief";

export type ArgensPolicy = {
  maxTransactionLimit?: string;
  allowanceLimit?: string;
  approvalThreshold?: string;
};

export type ArgensErrorKind = "disabled" | "policy_denied" | "network" | "upstream" | "invalid_response";

export class ArgensError extends Error {
  constructor(public kind: ArgensErrorKind, message: string, public detail?: unknown) {
    super(message);
    this.name = "ArgensError";
  }
}

export type ArgensCallResult<T> = {
  data: T;
  transactionId?: string;
  costUsd?: number;
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function defaultPolicy(): ArgensPolicy {
  return {
    maxTransactionLimit: env.argensMaxTransactionLimit,
    allowanceLimit: env.argensAllowanceLimit,
    approvalThreshold: env.argensApprovalThreshold
  };
}

function digest(input: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(input ?? "")).digest("hex").slice(0, 32);
}

function summarise(value: unknown, max = 500): string {
  if (value == null) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

async function logRun(row: {
  agent: AgentName;
  service: string;
  inputDigest?: string;
  outputSummary?: string;
  transactionId?: string;
  costUsd?: number;
  status: "ok" | "policy_denied" | "error" | "disabled" | "delivery_unverified";
  error?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!env.databaseUrl) return;
  try {
    await prisma.agentRun.create({
      data: {
        agent: row.agent,
        service: row.service,
        inputDigest: row.inputDigest,
        outputSummary: row.outputSummary,
        transactionId: row.transactionId,
        costUsd: row.costUsd != null ? (row.costUsd.toFixed(4) as unknown as Prisma.Decimal) : null,
        status: row.status,
        error: row.error,
        metadata: row.metadata as Prisma.InputJsonValue
      }
    });
  } catch {
    // Audit log is best-effort — never let it break the caller.
  }
}

// Wire shape matches the live Argens marketplace contract:
//   request:  { service_id, payload, query? }
//   success:  { data: { status, transaction_id, cost_paid (USDC string), result, ... } }
//   error:    { error, code, details? }
// Spending policy is enforced server-side from the developer's account
// settings — there's no per-request policy field, so the `policy` argument
// here is reserved for future use / local guardrail logging only.
export async function argensCall<T = unknown>(params: {
  service: string;
  payload: unknown;
  query?: Record<string, string>;
  agent: AgentName;
  policy?: ArgensPolicy;
}): Promise<ArgensCallResult<T>> {
  const { service, payload: inputPayload, agent } = params;
  const inputDigest = digest({ payload: inputPayload, query: params.query });

  if (!env.argensApiKey) {
    await logRun({ agent, service, inputDigest, status: "disabled" });
    throw new ArgensError("disabled", "ARGENS_API_KEY is unset");
  }

  let response: Response;
  try {
    response = await fetch(`${env.argensBaseUrl}/marketplace/call`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.argensApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_id: service,
        payload: inputPayload,
        ...(params.query ? { query: params.query } : {})
      })
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "fetch failed";
    await logRun({ agent, service, inputDigest, status: "error", error: message });
    throw new ArgensError("network", `Argens request failed: ${message}`);
  }

  const body = (await response.json().catch(() => null)) as
    | {
        data?: {
          status?: string;
          transaction_id?: string;
          stellar_tx_hash?: string;
          service_id?: string;
          service_name?: string;
          cost_paid?: string;
          currency?: string;
          result?: T;
        };
        error?: string;
        code?: string;
        details?: unknown;
      }
    | null;

  if (!response.ok || !body || body.error) {
    const message = body?.error ?? `HTTP ${response.status}`;
    const policyDenied = body?.code === "POLICY_DENIED" || body?.code === "POLICY_BLOCKED" || response.status === 402;
    await logRun({
      agent,
      service,
      inputDigest,
      status: policyDenied ? "policy_denied" : "error",
      error: `${body?.code ?? "HTTP"}: ${message}`
    });
    throw new ArgensError(
      policyDenied ? "policy_denied" : response.ok ? "invalid_response" : "upstream",
      `Argens ${service} failed: ${message}`,
      body
    );
  }

  if (!body.data || body.data.result === undefined) {
    await logRun({ agent, service, inputDigest, status: "error", error: "missing result" });
    throw new ArgensError("invalid_response", `Argens ${service} returned no result`);
  }

  const costUsd = body.data.cost_paid ? Number.parseFloat(body.data.cost_paid) : undefined;

  await logRun({
    agent,
    service,
    inputDigest,
    outputSummary: summarise(body.data.result),
    transactionId: body.data.transaction_id,
    costUsd,
    status: "ok"
  });

  return { data: body.data.result, transactionId: body.data.transaction_id, costUsd };
}

export async function argensChat(params: {
  messages: ChatMessage[];
  system?: string;
  maxTokens?: number;
  agent: AgentName;
  policy?: ArgensPolicy;
}): Promise<string> {
  const messages: ChatMessage[] = params.system
    ? [{ role: "system", content: params.system }, ...params.messages]
    : params.messages;

  // OpenAI-compatible chat-completions wire shape. Argens wraps the upstream
  // response at `data.result`, and some providers (DeepSeek, etc.) wrap once
  // more in `{success, data: {...}}` before the OpenAI envelope — so we walk
  // both `result.*` and `result.data.*`.
  type OpenAICompat = {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    text?: string;
    content?: string;
    output_text?: string;
    message?: { content?: string };
  };

  const raw = await argensCall<OpenAICompat & { data?: OpenAICompat }>({
    service: env.argensLlmService,
    payload: {
      model: env.argensLlmModel,
      messages,
      max_tokens: params.maxTokens ?? 400
    },
    agent: params.agent,
    policy: params.policy
  });

  // The upstream OpenAI-style payload lives either directly at result, or one
  // level deeper at result.data — try both before giving up.
  const inner: OpenAICompat = raw.data?.data ?? raw.data ?? {};
  const text =
    inner.choices?.[0]?.message?.content ??
    inner.choices?.[0]?.text ??
    inner.text ??
    inner.output_text ??
    inner.content ??
    inner.message?.content ??
    "";

  if (!text) {
    throw new ArgensError("invalid_response", `LLM returned empty text`);
  }
  return text;
}

// Known argens-side bug on the StableEmail merchant: the upstream call
// actually delivers the email, but the marketplace's Stellar/USDC payment
// verification step fails ("memo is not bound to this challenge"), so argens
// reports MARKETPLACE_UPSTREAM_FAILED. When that exact signature appears we
// treat it as a soft success ("delivered, billing unverified") and let the
// caller record the ambiguity in its own audit log. Remove this branch once
// argens fixes the StableEmail merchant channel.
function isKnownDeliveredButUnverified(detail: unknown): { matched: boolean; transactionId?: string } {
  if (!detail || typeof detail !== "object") return { matched: false };
  const d = detail as {
    code?: string;
    details?: {
      transaction_id?: string;
      upstream_body?: { detail?: string; error?: string };
    };
  };
  if (d.code !== "MARKETPLACE_UPSTREAM_FAILED") return { matched: false };
  const upstreamBlob = `${d.details?.upstream_body?.detail ?? ""} ${d.details?.upstream_body?.error ?? ""}`;
  if (!/memo is not bound to this challenge/i.test(upstreamBlob)) return { matched: false };
  return { matched: true, transactionId: d.details?.transaction_id };
}

export async function argensSendMail(params: {
  to: string;
  subject: string;
  html: string;
  agent: AgentName;
  policy?: ArgensPolicy;
}): Promise<{ transactionId?: string; deliveryUnverified?: boolean }> {
  // StableEmail expects `to` as an array and the message under either `html`
  // or `text` (not `body`). If we ever swap to AgentMail or another provider
  // this payload shape may need adjusting.
  try {
    const result = await argensCall<{ id?: string }>({
      service: env.argensMailService,
      payload: {
        from: env.argensFromAddress,
        to: [params.to],
        subject: params.subject,
        html: params.html
      },
      agent: params.agent,
      policy: params.policy
    });
    return { transactionId: result.transactionId };
  } catch (error) {
    if (error instanceof ArgensError) {
      const known = isKnownDeliveredButUnverified(error.detail);
      if (known.matched) {
        await logRun({
          agent: params.agent,
          service: env.argensMailService,
          status: "delivery_unverified",
          transactionId: known.transactionId,
          error: "MARKETPLACE_UPSTREAM_FAILED: memo not bound — delivered, billing unverified",
          metadata: { recipient: params.to, knownArgensBug: true }
        });
        return { transactionId: known.transactionId, deliveryUnverified: true };
      }
    }
    throw error;
  }
}

export function isArgensDisabled(): boolean {
  return !env.argensApiKey;
}
