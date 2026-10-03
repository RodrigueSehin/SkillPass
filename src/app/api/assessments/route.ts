import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/handler";
import { getAssessmentService } from "@/services/container";

export const GET = withUser(async (user) =>
  NextResponse.json({ items: await getAssessmentService().list(user.id) }),
);
