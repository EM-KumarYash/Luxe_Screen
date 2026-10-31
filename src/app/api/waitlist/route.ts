import { apiHandler, parseBody } from "@/lib/api";
import { waitlistSchema } from "@/lib/validation";
import { joinWaitlist } from "@/server/leads";

export const POST = apiHandler(
  async (request) => {
    const input = await parseBody(request, waitlistSchema);
    return Response.json({ entry: await joinWaitlist(input) }, { status: 201 });
  },
  { rateLimit: { key: "waitlist", limit: 5, windowMs: 60_000 } },
);
