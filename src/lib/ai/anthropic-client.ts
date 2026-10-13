import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AIUnavailableError, type AIClient, type AICompletion } from "./ai-client";

const DEFAULT_MODEL = "claude-opus-5-5";

/** Claude behind the AIClient seam. Answers are parsed against the request's Zod schema (structured outputs). */
export class AnthropicAIClient implements AIClient {
  private readonly client: Anthropic;

  constructor(
    private readonly model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    client?: Anthropic,
  ) {
    this.client = client ?? new Anthropic({ maxRetries: 2, timeout: 60_000 });
  }

  async complete<T>({ system, user, schema, maxTokens = 2000, pdf }: AICompletion<T>): Promise<T> {
    try {
      const response = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [
          {
            role: "user",
            content: pdf
              ? [
                  {
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: "application/pdf",
                      data: Buffer.from(pdf).toString("base64"),
                    },
                  },
                  { type: "text", text: user },
                ]
              : user,
          },
        ],
        // Short, factual answers: low effort is enough and keeps the latency of a click acceptable.
        output_config: { effort: "low", format: zodOutputFormat(schema) },
        // If the safety classifiers decline, the server retries on its default fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
        throw new AIUnavailableError();
      }
      if (!response.parsed_output) throw new AIUnavailableError();
      return response.parsed_output as T;
    } catch (err) {
      if (err instanceof AIUnavailableError) throw err;
      // Typed API errors (rate limit, overloaded, network...) are logged, never shown: the feature degrades.
      console.error(
        "AI request failed",
        err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err,
      );
      throw new AIUnavailableError();
    }
  }
}

/** The configured client, or null when no API key is set (the product then runs on its rule-based fallbacks). */
export function getAIClient(): AIClient | null {
  return process.env.ANTHROPIC_API_KEY ? new AnthropicAIClient() : null;
}
