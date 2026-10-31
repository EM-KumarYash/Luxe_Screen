import type { Metadata } from "next";

import { GalleryExplorer } from "@/components/gallery/gallery-explorer";
import { Container, SectionHeading } from "@/components/ui/container";
import { listLocations, listTheaters } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Theatres",
  description:
    "Browse our private luxury theatres by city, group size and price, and view photos of every suite.",
};

export default async function GalleryPage() {
  const [theaters, locations] = await Promise.all([listTheaters(), listLocations()]);

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        as="h1"
        eyebrow="Gallery"
        title="Find your perfect theatre"
        text="Search, filter and compare every private screen. Tap a photo to look inside."
      />
      <div className="mt-12">
        <GalleryExplorer
          theaters={theaters}
          locations={locations.filter((l) => l.status === "ACTIVE")}
        />
      </div>
    </Container>
  );
}
