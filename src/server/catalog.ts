import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { AddOnCategory, AddOnDTO, LocationDTO, TheaterDTO } from "@/types";

export const theaterInclude = {
  location: { select: { slug: true, name: true, city: true } },
} satisfies Prisma.TheaterInclude;

type TheaterRow = Prisma.TheaterGetPayload<{ include: typeof theaterInclude }>;

export function toTheaterDTO(t: TheaterRow): TheaterDTO {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    tagline: t.tagline,
    description: t.description,
    basePrice: t.basePrice,
    includedGuests: t.includedGuests,
    extraGuestPrice: t.extraGuestPrice,
    maxCapacity: t.maxCapacity,
    screen: t.screen,
    sound: t.sound,
    images: t.images,
    amenities: t.amenities,
    rating: t.rating,
    location: t.location,
  };
}

export const addOnInclude = {
  options: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, price: true },
  },
} satisfies Prisma.AddOnInclude;

type AddOnRow = Prisma.AddOnGetPayload<{ include: typeof addOnInclude }>;

export function toAddOnDTO(a: AddOnRow): AddOnDTO {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category,
    image: a.image,
    options: a.options,
  };
}

// Catalogue reads change rarely, so they are cached (tag "catalog") and can be
// rendered into the static shell. Booking availability is never cached.
export async function listLocations(): Promise<LocationDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  return prisma.location.findMany({
    orderBy: [{ status: "asc" }, { city: "asc" }],
    select: { id: true, slug: true, name: true, city: true, address: true, status: true },
  });
}

export async function listTheaters(filter: { location?: string } = {}): Promise<TheaterDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const theaters = await prisma.theater.findMany({
    where: {
      isActive: true,
      location: { status: "ACTIVE", ...(filter.location ? { slug: filter.location } : {}) },
    },
    include: theaterInclude,
    orderBy: [{ location: { city: "asc" } }, { basePrice: "asc" }],
  });
  return theaters.map(toTheaterDTO);
}

export async function getTheaterBySlug(slug: string): Promise<TheaterDTO | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const theater = await prisma.theater.findFirst({
    where: { slug, isActive: true },
    include: theaterInclude,
  });
  return theater ? toTheaterDTO(theater) : null;
}

export async function listAddOns(filter: { category?: AddOnCategory } = {}): Promise<AddOnDTO[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const addOns = await prisma.addOn.findMany({
    where: { isActive: true, ...(filter.category ? { category: filter.category } : {}) },
    include: addOnInclude,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
  return addOns.filter((a) => a.options.length > 0).map(toAddOnDTO);
}
