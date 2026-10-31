import { ApiError, apiHandler } from "@/lib/api";
import { getTheaterBySlug } from "@/server/catalog";

export const GET = apiHandler<RouteContext<"/api/theaters/[slug]">>(async (_request, ctx) => {
  const { slug } = await ctx.params;
  const theater = await getTheaterBySlug(slug);
  if (!theater) throw new ApiError(404, "NOT_FOUND", "Theatre not found.");
  return Response.json({ theater });
});
