import { apiHandler, parseBody } from "@/lib/api";
import { plannerSchema } from "@/lib/validation";
import { recommendExperience } from "@/server/planner";

export const POST = apiHandler(
  async (request) => {
    const input = await parseBody(request, plannerSchema);
    return Response.json(await recommendExperience(input));
  },
  { rateLimit: { key: "planner", limit: 30, windowMs: 60_000 } },
);
