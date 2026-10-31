import { z } from "zod";

import { apiHandler, parseQuery } from "@/lib/api";
import { listTheaters } from "@/server/catalog";

const querySchema = z.object({ location: z.string().trim().max(80).optional() });

export const GET = apiHandler(async (request) => {
  const { location } = parseQuery(request, querySchema);
  return Response.json({ theaters: await listTheaters({ location }) });
});
