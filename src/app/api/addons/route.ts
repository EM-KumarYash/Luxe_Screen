import { z } from "zod";

import { apiHandler, parseQuery } from "@/lib/api";
import { listAddOns } from "@/server/catalog";

const querySchema = z.object({ category: z.enum(["CAKE", "DECOR", "GIFT"]).optional() });

export const GET = apiHandler(async (request) => {
  const { category } = parseQuery(request, querySchema);
  return Response.json({ addOns: await listAddOns({ category }) });
});
