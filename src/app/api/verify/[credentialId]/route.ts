import { NextResponse, type NextRequest } from "next/server";
import { withPublic } from "@/lib/api/handler";
import { getCredentialService } from "@/services/container";

/** Public by design: anyone holding a credential id may verify it. */
export const GET = withPublic(
  async (_request: NextRequest, ctx: RouteContext<"/api/verify/[credentialId]">) => {
    const { credentialId } = await ctx.params;
    return NextResponse.json(await getCredentialService().verify(credentialId));
  },
);
