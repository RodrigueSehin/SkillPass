import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, UnauthorizedError } from "@/lib/errors";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

/** Maps any thrown error to a safe JSON response. Technical details are logged, never returned. */
export function errorResponse(err: unknown): Response {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: err.issues[0]?.message ?? "Données invalides" } },
      { status: 400 },
    );
  }
  if (err instanceof AppError) {
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  console.error("API error", err);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Une erreur est survenue" } },
    { status: 500 },
  );
}

/** Wraps a route handler: authenticates, and maps domain errors to safe JSON responses. */
export function withUser<Args extends unknown[]>(
  handler: (user: CurrentUser, ...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new UnauthorizedError();
      return await handler(user, ...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** For endpoints that are intentionally public (credential verification, recommendation links). */
export function withPublic<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
