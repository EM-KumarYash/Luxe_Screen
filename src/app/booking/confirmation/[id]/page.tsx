import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { WizardSkeleton } from "@/components/booking/booking-wizard";
import { PrintButton } from "@/components/booking/print-button";
import { Receipt } from "@/components/booking/receipt";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getBooking } from "@/server/bookings";

export const metadata: Metadata = {
  title: "Booking Receipt",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage({ params }: PageProps<"/booking/confirmation/[id]">) {
  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <Suspense fallback={<WizardSkeleton />}>
        <ReceiptLoader params={params} />
      </Suspense>
    </Container>
  );
}

async function ReceiptLoader({
  params,
}: {
  params: PageProps<"/booking/confirmation/[id]">["params"];
}) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <Receipt booking={booking} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
        <PrintButton />
        <ButtonLink href="/booking">Book another experience</ButtonLink>
      </div>
    </div>
  );
}
