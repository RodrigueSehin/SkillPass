import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { updateProfileSchema } from "@/schemas/profile";
import { getProfileAccountService } from "@/services/container";

export const GET = withUser(async (user) => NextResponse.json(await getProfileAccountService().get(user)));

export const PATCH = withUser(async (user, request: NextRequest) => {
  const input = updateProfileSchema.parse(await request.json());
  return NextResponse.json(await getProfileAccountService().update(user.id, input));
});
