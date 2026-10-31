import { apiHandler, parseBody } from "@/lib/api";
import { couponValidateSchema } from "@/lib/validation";
import { validateCoupon } from "@/server/bookings";

export const POST = apiHandler(
  async (request) => {
    const input = await parseBody(request, couponValidateSchema);
    return Response.json(await validateCoupon(input));
  },
  { rateLimit: { key: "coupon", limit: 20, windowMs: 60_000 } },
);
