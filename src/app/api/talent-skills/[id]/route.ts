import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { updateTalentSkillSchema } from "@/schemas/skill";
import { getSkillService } from "@/services/container";

export const GET = withUser(async (user, _request: NextRequest, ctx: RouteContext<"/api/talent-skills/[id]">) => {
  const { id } = await ctx.params;
  return NextResponse.json(await getSkillService().get(user.id, id));
});

export const PATCH = withUser(async (user, request: NextRequest, ctx: RouteContext<"/api/talent-skills/[id]">) => {
  const { id } = await ctx.params;
  const input = updateTalentSkillSchema.parse(await request.json());
  return NextResponse.json(await getSkillService().update(user.id, id, input));
});

export const DELETE = withUser(async (user, _request: NextRequest, ctx: RouteContext<"/api/talent-skills/[id]">) => {
  const { id } = await ctx.params;
  await getSkillService().remove(user.id, id);
  return new Response(null, { status: 204 });
});
