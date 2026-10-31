import { apiHandler, parseBody } from "@/lib/api";
import { contactSchema } from "@/lib/validation";
import { submitContactMessage } from "@/server/leads";

export const POST = apiHandler(
  async (request) => {
    const input = await parseBody(request, contactSchema);
    return Response.json({ message: await submitContactMessage(input) }, { status: 201 });
  },
  { rateLimit: { key: "contact", limit: 5, windowMs: 60_000 } },
);
