import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/business/context";
import { getOrganizationLifecycleService } from "@/services/container";

export const dynamic = "force-dynamic";

/** All the data of the organization as one JSON file. Administrators only: it holds every member's e-mail. */
export async function GET() {
  const ctx = await requireBusiness();
  if (ctx.member.role !== "ADMIN" || !ctx.can("org.manage")) {
    return NextResponse.json(
      { error: { message: "Seul un administrateur peut exporter les données." } },
      { status: 403 },
    );
  }
  const data = await getOrganizationLifecycleService().exportData(ctx);
  const stamp = data.exportedAt.slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="skillpass-${ctx.organization.slug}-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
