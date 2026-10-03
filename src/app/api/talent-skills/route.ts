import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { createTalentSkillSchema, listTalentSkillsQuerySchema } from "@/schemas/skill";
import { getSkillService } from "@/services/container";

export const GET = withUser(async (user, request: NextRequest) => {
  const query = listTalentSkillsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json(await getSkillService().list(user.id, query));
});

export const POST = withUser(async (user, request: NextRequest) => {
  const input = createTalentSkillSchema.parse(await request.json());
  return NextResponse.json(await getSkillService().add(user.id, input), { status: 201 });
});
