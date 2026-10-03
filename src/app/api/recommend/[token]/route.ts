import { NextResponse, type NextRequest } from "next/server";
import { withPublic } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { submitRecommendationSchema } from "@/schemas/verification";
import { getRecommendationService } from "@/services/container";

/** Public: the recommender has no account, the unguessable token is the credential. */
export const GET = withPublic(async (_request: NextRequest, ctx: RouteContext<"/api/recommend/[token]">) => {
  const { token } = await ctx.params;
  return NextResponse.json(await getRecommendationService().getInvite(token));
});

export const POST = withPublic(async (request: NextRequest, ctx: RouteContext<"/api/recommend/[token]">) => {
  const { token } = await ctx.params;
  // Blunts token guessing and spam from one address; the token itself carries 256 bits of entropy.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  rateLimit(`reco-submit:${ip}`, 10, 60_000);
  const input = submitRecommendationSchema.parse(await request.json());
  await getRecommendationService().submit(token, input);
  return NextResponse.json({ ok: true }, { status: 201 });
});
