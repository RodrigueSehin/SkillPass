import type { ZodType } from "zod";
import { AppError } from "@/lib/errors";

/** The IA is not configured, refused the request, or answered something unusable: callers fall back to rules. */
export class AIUnavailableError extends AppError {
  constructor(message = "L'assistant IA est momentanément indisponible.") {
    super(message, 503, "AI_UNAVAILABLE");
  }
}

export interface AICompletion<T> {
  /** What the assistant is and must never do. Stable across calls. */
  system: string;
  /** The data of this call, already reduced to what the task needs. */
  user: string;
  /** The answer must match this schema: the client validates it and never returns anything else. */
  schema: ZodType<T>;
  maxTokens?: number;
}

/**
 * The single seam between SkillPass and a language model. Features (AIService) depend on this interface,
 * never on a vendor SDK, so the provider can change or be faked in tests without touching them.
 */
export interface AIClient {
  complete<T>(request: AICompletion<T>): Promise<T>;
}
