import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/handler";
import { getCredentialService } from "@/services/container";

export const GET = withUser(async (user) =>
  NextResponse.json({ items: await getCredentialService().listForProfile(user.id) }),
);
