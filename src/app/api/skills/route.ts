import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { getSkillService } from "@/services/container";

/** Skill catalog autocomplete: GET /api/skills?q=pow */
export const GET = withUser(async (_user, request: NextRequest) => {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({ items: await getSkillService().searchCatalog(q) });
});
