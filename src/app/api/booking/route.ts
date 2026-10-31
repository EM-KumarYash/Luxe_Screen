import { apiHandler, parseBody } from "@/lib/api";
import { createBookingSchema } from "@/lib/validation";
import { createBooking } from "@/server/bookings";

/** Creates a PENDING booking that holds the slot while the customer pays. */
export const POST = apiHandler(
  async (request) => {
    const input = await parseBody(request, createBookingSchema);
    const booking = await createBooking(input);
    return Response.json({ booking }, { status: 201 });
  },
  { rateLimit: { key: "booking", limit: 10, windowMs: 60_000 } },
);
