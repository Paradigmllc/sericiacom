/**
 * DeepSeek V3 client — cache-prefix-aware.
 *
 * Why this file exists:
 *   DeepSeek's Context Caching gives ~90% off input tokens when the SAME
 *   system-message prefix is sent across requests (server auto-detects the
 *   shared prefix byte-for-byte; no opt-in flag). For a pSEO/article pipeline
 *   that ships 100s of articles with the same style guide, the brand rules
 *   are the identical 2–4K token system prompt — they cache — and only the
 *   variable topic/keywords/locale live in the user message.
 *
 *   Effective input price at cache hit: $0.014 / 1M tokens.
 *   Effective output price:             $0.28  / 1M tokens.
 *   One ~1,200-word article costs roughly $0.0004 in input (prefix cached)
 *   and $0.0008 in output. Full article: < $0.002 all-in.
 *
 * Hard rules enforced here (CLAUDE.md U — external API 3-point kit):
 *   1. AbortSignal.timeout() — no unbounded awaits.
 *   2. 429 retry with exponential backoff + jitter — rate limits are non-fatal.
 *   3. Minimal input validation — if the caller sends garbage, we throw early
 *      so the error surfaces at the call site, not inside a JSON.parse() 200
 *      lines downstream.
 *
 * JSON-mode contract:
 *   Callers that need structured output pass `response_format: "json_object"`.
 *   DeepSeek then guarantees the output is parseable JSON — we still
 *   `JSON.parse` with a try/catch because the model can occasionally emit
 *   an empty string or a truncated payload on timeout. On parse failure,
 *   we throw a typed error with the raw text so the caller can decide
 *   whether to retry or bail.
 */

export type DeepSeekRole = "system" | "user" | "assistant";

export type DeepSeekMessage = {
  role: DeepSeekRole;
  content: string;
};

export type DeepSeekChatOptions = {
  /**
   * Model id. F43 migration 2026-04-30: DeepSeek deprecated the V3
   * `deepseek-chat` / `deepseek-reasoner` aliases when V4 shipped.
   * Only V4 endpoints accept new requests now. The mapping:
   *   deepseek-chat (V3 default)    → deepseek-v4-flash (V4 default)
   *   deepseek-reasoner (V3 reasoning) → deepseek-v4-pro (V4 reasoning)
   * Context Caching (the 90%-OFF discount on identical prefix prefixes)
   * carries over to V4 and remains the cost lever for our pSEO matrix
   * generator.
   */
  model?: "deepseek-v4-flash" | "deepseek-v4-pro";
  /**
   * If true, enforces JSON-parseable output. When used, the caller MUST include
   * the word "JSON" in their prompt — DeepSeek refuses the request otherwise.
   */
  json?: boolean;
  temperature?: number;
  max_tokens?: number;
  /** Per-request timeout. Default 60s — article generation can run long. */
  timeoutMs?: number;
  /** How many times to retry on 429/5xx. Default 2 (so 3 total attempts). */
  maxRetries?: number;
};

export type DeepSeekUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  /**
   * Present when Context Caching hit. Same units as prompt_tokens.
   * `prompt_cache_hit_tokens` >0 confirms the cache discount applied.
   */
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
};

export type DeepSeekChatResult = {
  text: string;
  finish_reason: string;
  usage: DeepSeekUsage;
  /** Round-trip including retries. Useful for n8n run-time dashboards. */
  elapsed_ms: number;
};

export class DeepSeekError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "DeepSeekError";
  }
}

/** Sleep helper for retry backoff. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call DeepSeek's Chat Completions endpoint.
 *
 * @example
 *   const { text, usage } = await deepseekChat(
 *     [
 *       { role: "system", content: BRAND_STYLE_GUIDE }, // stays byte-identical → cached
 *       { role: "user",   content: `Write an article about ${topic} in ${locale}. Return JSON.` },
 *     ],
 *     { json: true, max_tokens: 3500 },
 *   );
 *   const article = JSON.parse(text);
 */
export async function deepseekChat(
  messages: readonly DeepSeekMessage[],
  opts: DeepSeekChatOptions = {},
): Promise<DeepSeekChatResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekError(
      "DEEPSEEK_API_KEY is missing. Set it in the environment before calling deepseekChat().",
    );
  }
  if (messages.length === 0) {
    throw new DeepSeekError("deepseekChat() called with empty messages array.");
  }
  if (opts.json && !messages.some((m) => /\bJSON\b/.test(m.content))) {
    // DeepSeek's docs: in JSON-object mode the word "JSON" must appear in
    // the prompt. If it doesn't, the API 400s and wastes a retry budget.
    throw new DeepSeekError(
      "json: true requires the word 'JSON' in at least one message (DeepSeek API contract).",
    );
  }

  const model = opts.model ?? "deepseek-v4-flash";
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const maxRetries = opts.maxRetries ?? 2;

  const body = JSON.stringify({
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 3500,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
  });

  const startedAt = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 429 || res.status >= 500) {
        // Retryable. Body is text so we can log it for debugging.
        const errBody = await res.text().catch(() => "");
        lastError = new DeepSeekError(
          `DeepSeek ${res.status}: ${errBody.slice(0, 300)}`,
          res.status,
          errBody,
        );
        if (attempt < maxRetries) {
          // Exponential backoff with jitter: 500ms, 1500ms, 3500ms...
          const base = 500 * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * 250);
          await wait(base + jitter);
          continue;
        }
        throw lastError;
      }

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new DeepSeekError(
          `DeepSeek ${res.status}: ${errBody.slice(0, 300)}`,
          res.status,
          errBody,
        );
      }

      const json = (await res.json()) as {
        choices: { message: { content: string }; finish_reason: string }[];
        usage: DeepSeekUsage;
      };
      const choice = json.choices?.[0];
      if (!choice?.message?.content) {
        throw new DeepSeekError("DeepSeek returned empty choices[0].message.content.", res.status, json);
      }
      return {
        text: choice.message.content,
        finish_reason: choice.finish_reason,
        usage: json.usage,
        elapsed_ms: Date.now() - startedAt,
      };
    } catch (e) {
      // AbortError (timeout) and network errors are retryable.
      const name = e instanceof Error ? e.name : "";
      const isRetryable = name === "AbortError" || name === "TypeError";
      lastError = e;
      if (isRetryable && attempt < maxRetries) {
        const base = 500 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 250);
        await wait(base + jitter);
        continue;
      }
      throw e;
    }
  }

  // Unreachable in practice — the loop either returns or throws.
  throw lastError instanceof Error
    ? lastError
    : new DeepSeekError("DeepSeek: exhausted retries with unknown error.");
}

/**
 * Convenience: call DeepSeek in JSON mode and parse the result.
 * Throws DeepSeekError on parse failure with the raw text attached as .body.
 */
export async function deepseekJSON<T = unknown>(
  messages: readonly DeepSeekMessage[],
  opts: Omit<DeepSeekChatOptions, "json"> = {},
): Promise<{ data: T; usage: DeepSeekUsage; elapsed_ms: number }> {
  const res = await deepseekChat(messages, { ...opts, json: true });
  try {
    return { data: JSON.parse(res.text) as T, usage: res.usage, elapsed_ms: res.elapsed_ms };
  } catch (e) {
    throw new DeepSeekError(
      `DeepSeek JSON parse failed: ${e instanceof Error ? e.message : String(e)}`,
      undefined,
      res.text,
    );
  }
}
