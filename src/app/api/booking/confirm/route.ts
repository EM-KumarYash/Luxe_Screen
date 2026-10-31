import { apiHandler, parseBody } from "@/lib/api";
import { confirmBookingSchema } from "@/lib/validation";
import { confirmBooking } from "@/server/bookings";

/** Simulated payment gateway: settles payment and confirms the booking. */
export const POST = apiHandler(
  async (request) => {
    const input = await parseBody(request, confirmBookingSchema);
    return Response.json({ booking: await confirmBooking(input) });
  },
  { rateLimit: { key: "confirm", limit: 20, windowMs: 60_000 } },
);
