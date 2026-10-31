import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import type { ContactInput, WaitlistInput } from "@/lib/validation";

export async function joinWaitlist(input: WaitlistInput) {
  const location = await prisma.location.findUnique({ where: { slug: input.location } });
  if (!location) throw new ApiError(404, "NOT_FOUND", "Unknown location.");

  try {
    const entry = await prisma.waitlistEntry.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        locationId: location.id,
      },
    });
    return { id: entry.id, location: { name: location.name, city: location.city } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(
        409,
        "ALREADY_ON_WAITLIST",
        `You're already on the waitlist for ${location.name}, ${location.city}.`,
      );
    }
    throw error;
  }
}

export async function submitContactMessage(input: ContactInput) {
  const message = await prisma.contactMessage.create({ data: input });
  return { id: message.id };
}
