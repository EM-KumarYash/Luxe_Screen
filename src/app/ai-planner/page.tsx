import type { Metadata } from "next";

import { PlannerForm } from "@/components/planner/planner-form";
import { Container, SectionHeading } from "@/components/ui/container";
import { listLocations } from "@/server/catalog";

export const metadata: Metadata = {
  title: "AI Experience Planner",
  description:
    "Tell us the occasion, budget and guest count and get a recommended theatre with a cake, decor and gift package.",
};

export default async function AiPlannerPage() {
  const locations = (await listLocations()).filter((l) => l.status === "ACTIVE");

  return (
    <Container className="max-w-5xl py-14 sm:py-20">
      <SectionHeading
        as="h1"
        eyebrow="AI Experience Planner"
        title="Tell us the moment. We'll plan the rest."
        text="Pick your occasion, budget and group size, and we'll recommend the right theatre with a matching cake, decor and gift package."
      />
      <div className="mt-12">
        <PlannerForm locations={locations} />
      </div>
    </Container>
  );
}
