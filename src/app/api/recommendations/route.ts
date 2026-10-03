import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { appUrl } from "@/lib/utils/app-url";
import { rateLimit } from "@/lib/rate-limit";
import { requestRecommendationSchema } from "@/schemas/verification";
import { getRecommendationService } from "@/services/container";

export const GET = withUser(async (user) =>
  NextResponse.json({ items: await getRecommendationService().list(user.id) }),
);

export const POST = withUser(async (user, request: NextRequest) => {
  rateLimit(`reco-request:${user.id}`, 10, 60_000);
  const input = requestRecommendationSchema.parse(await request.json());
  const created = await getRecommendationService().request(user.id, input);
  return NextResponse.json({ ...created, link: `${appUrl()}/recommend/${created.token}` }, { status: 201 });
});
