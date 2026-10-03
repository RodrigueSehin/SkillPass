import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, UnauthorizedError } from "@/lib/errors";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

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
      return NextResponse.json({ error: { code: "INTERNAL", message: "Une erreur est survenue" } }, { status: 500 });
    }
  };
}
