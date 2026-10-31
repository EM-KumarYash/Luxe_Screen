import { connection } from "next/server";

import { apiHandler } from "@/lib/api";
import { listLocations } from "@/server/catalog";

export const GET = apiHandler(async () => {
  await connection();
  return Response.json({ locations: await listLocations() });
});
