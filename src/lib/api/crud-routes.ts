import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { withUser } from "./handler";
import type { CrudService } from "@/lib/crud";

type Service<Dto extends { id: string }, C, P> = () => CrudService<Dto, C, P>;

/** Collection routes: GET list, POST create. */
export function collectionRoutes<Dto extends { id: string }, C, P>(
  service: Service<Dto, C, P>,
  createSchema: ZodType<C>,
) {
  return {
    GET: withUser(async (user) => NextResponse.json({ items: await service().list(user.id) })),
    POST: withUser(async (user, request: NextRequest) => {
      const input = createSchema.parse(await request.json());
      return NextResponse.json(await service().add(user.id, input), { status: 201 });
    }),
  };
}

/** Item routes: GET, PATCH, DELETE. Pass the route's RouteContext type through `Ctx`. */
export function itemRoutes<Dto extends { id: string }, C, P>(
  service: Service<Dto, C, P>,
  patchSchema: ZodType<P>,
) {
  type Ctx = { params: Promise<{ id: string }> };
  return {
    GET: withUser(async (user, _req: NextRequest, ctx: Ctx) =>
      NextResponse.json(await service().get(user.id, (await ctx.params).id)),
    ),
    PATCH: withUser(async (user, request: NextRequest, ctx: Ctx) => {
      const patch = patchSchema.parse(await request.json());
      return NextResponse.json(await service().update(user.id, (await ctx.params).id, patch));
    }),
    DELETE: withUser(async (user, _req: NextRequest, ctx: Ctx) => {
      await service().remove(user.id, (await ctx.params).id);
      return new Response(null, { status: 204 });
    }),
  };
}
