import { MapPin } from "lucide-react";
import type { Metadata } from "next";

import { Container, SectionHeading } from "@/components/ui/container";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { listLocations } from "@/server/catalog";

export const metadata: Metadata = {
  title: "New Locations",
  description:
    "Luxe Screens is coming to Mumbai, Pune and Delhi. Join the waitlist for early access.",
};

export default async function WaitlistPage() {
  const upcoming = (await listLocations()).filter((l) => l.status === "COMING_SOON");

  return (
    <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:items-start">
      <div>
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Coming soon"
          title="New screens are on their way"
          text="We're opening private theatres in more cities. Join the waitlist to get first access to bookings and an early-bird offer."
        />
        <ul className="mt-10 space-y-3">
          {upcoming.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-ink-900 p-4"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-gold-500/10 text-gold-400">
                <MapPin aria-hidden className="size-5" />
              </span>
              <div>
                <p className="font-medium text-white">{l.city}</p>
                <p className="text-sm text-zinc-400">{l.name}</p>
              </div>
              <span className="ml-auto rounded-full border border-gold-400/30 px-3 py-1 text-xs text-gold-300">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
      </div>
      <WaitlistForm locations={upcoming} />
    </Container>
  );
}
