import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  BookingWizard,
  WizardSkeleton,
  type BookingPrefill,
} from "@/components/booking/booking-wizard";
import type { CartEntry } from "@/components/booking/booking-state";
import { Container, SectionHeading } from "@/components/ui/container";
import { addDays, BOOKING_WINDOW_DAYS, todayInIST } from "@/lib/dates";
import { OCCASIONS, type OccasionKey } from "@/lib/planner";
import { listAddOns, listLocations, listTheaters } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Book a Theatre",
  description:
    "Book a private theatre in 9 easy steps: pick a slot, add cakes, decor and gifts, and pay securely.",
};

export default function BookingPage({ searchParams }: PageProps<"/booking">) {
  return (
    <Container className="py-10 sm:py-14">
      <div className="print:hidden">
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Book your experience"
          title="Reserve your private theatre"
          text="Nine quick steps from picking a slot to your confirmation. Your progress is saved if you refresh."
        />
      </div>
      <div className="mt-10">
        <Suspense fallback={<WizardSkeleton />}>
          <BookingLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function BookingLoader({
  searchParams,
}: {
  searchParams: PageProps<"/booking">["searchParams"];
}) {
  // "Today" must be computed per request, not baked into the static shell.
  await connection();
  const [params, locations, theaters, addOns] = await Promise.all([
    searchParams,
    listLocations(),
    listTheaters(),
    listAddOns(),
  ]);
  const active = locations.filter((l) => l.status === "ACTIVE");
  const today = todayInIST();

  // Validate deep-link parameters from the gallery and AI planner; ignore anything unknown.
  const theater = theaters.find((t) => t.slug === first(params.theater));
  const locationParam = first(params.location);
  const location =
    theater?.location.slug ??
    active.find((l) => l.slug === locationParam)?.slug ??
    active[0]?.slug ??
    "";
  const occasionParam = first(params.occasion);
  const occasion = OCCASIONS.includes(occasionParam as OccasionKey)
    ? (occasionParam as OccasionKey)
    : undefined;
  const guestsParam = Number(first(params.guests));
  const guests =
    Number.isInteger(guestsParam) && guestsParam >= 1 && guestsParam <= 20
      ? guestsParam
      : undefined;

  const cart: Record<string, CartEntry> = {};
  for (const optionId of (first(params.options) ?? "").split(",").filter(Boolean)) {
    const addOn = addOns.find((a) => a.options.some((o) => o.id === optionId));
    if (addOn) cart[addOn.id] = { optionId, quantity: 1 };
  }

  const prefill: BookingPrefill = {
    fromLink: Boolean(theater || locationParam || occasion || guests || Object.keys(cart).length),
    location,
    guests,
    occasion,
    theaterId: theater?.id,
    cart,
  };

  return (
    <BookingWizard
      locations={active}
      addOns={addOns}
      today={today}
      maxDate={addDays(today, BOOKING_WINDOW_DAYS)}
      prefill={prefill}
    />
  );
}
