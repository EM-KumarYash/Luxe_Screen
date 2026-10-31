import { ApiError, apiHandler } from "@/lib/api";
import { getBooking } from "@/server/bookings";

export const GET = apiHandler<RouteContext<"/api/booking/[id]">>(async (_request, ctx) => {
  const { id } = await ctx.params;
  const booking = await getBooking(id);
  if (!booking) throw new ApiError(404, "NOT_FOUND", "Booking not found.");
  return Response.json({ booking }, { headers: { "Cache-Control": "no-store" } });
});
