import { apiHandler, parseQuery } from "@/lib/api";
import { slotsQuerySchema } from "@/lib/validation";
import { getAvailability } from "@/server/availability";

/** GET /api/slots?date=YYYY-MM-DD&location=<slug> | &theaterId=<id> */
export const GET = apiHandler(async (request) => {
  const query = parseQuery(request, slotsQuerySchema);
  return Response.json(await getAvailability(query), {
    headers: { "Cache-Control": "no-store" },
  });
});
