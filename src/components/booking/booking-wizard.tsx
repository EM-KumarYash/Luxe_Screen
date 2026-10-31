"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { OccasionKey } from "@/lib/planner";
import type { AddOnDTO, LocationDTO } from "@/types";

import {
  clearStoredState,
  createInitialState,
  loadStoredState,
  saveState,
  selectTheater,
  wizardReducer,
  type CartEntry,
  type StepNumber,
} from "./booking-state";
import { cartLines, OrderSummary, previewPrice } from "./order-summary";
import { Receipt } from "./receipt";
import { Stepper } from "./stepper";
import { AddOnStep } from "./steps/addon-step";
import { ContactStep } from "./steps/contact-step";
import { DateTimeStep } from "./steps/date-time-step";
import { OccasionStep } from "./steps/occasion-step";
import { PaymentStep } from "./steps/payment-step";
import { TheaterStep } from "./steps/theater-step";
import { useAvailability } from "./use-availability";

export type BookingPrefill = {
  /** True when the wizard was opened from a deep link (gallery / planner). */
  fromLink: boolean;
  location: string;
  guests?: number;
  occasion?: OccasionKey;
  theaterId?: string;
  cart?: Record<string, CartEntry>;
};

export function BookingWizard({
  locations,
  addOns,
  today,
  maxDate,
  prefill,
}: {
  locations: LocationDTO[];
  addOns: AddOnDTO[];
  today: string;
  maxDate: string;
  prefill: BookingPrefill;
}) {
  const initialState = useMemo(
    () =>
      createInitialState({
        today,
        location: prefill.location,
        guests: prefill.guests,
        occasion: prefill.occasion,
        preferredTheaterId: prefill.theaterId,
        cart: prefill.cart,
      }),
    [today, prefill],
  );
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const addOnsById = useMemo(() => new Map(addOns.map((a) => [a.id, a])), [addOns]);

  // Restore an in-progress booking after a refresh. A deep link starts fresh instead.
  useEffect(() => {
    const stored = prefill.fromLink ? null : loadStoredState(today);
    if (stored) dispatch({ type: "HYDRATE", state: stored });
    if (prefill.fromLink) window.history.replaceState(null, "", "/booking");
    setHydrated(true); // eslint-disable-line react-hooks/set-state-in-effect -- one-time client-only restore
  }, [prefill.fromLink, today]);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // Bring the new step into view (not on first render).
  const lastStep = useRef(state.step);
  useEffect(() => {
    if (!hydrated || lastStep.current === state.step) return;
    lastStep.current = state.step;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Move focus to the new step heading for keyboard and screen-reader users.
    const heading = topRef.current?.querySelector<HTMLElement>("h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [state.step, hydrated]);

  const availability = useAvailability(state.location, state.date, hydrated && state.step <= 2);

  const go = (step: StepNumber) => dispatch({ type: "GO", step });
  const back = () => go((state.step - 1) as StepNumber);
  const next = () => go((state.step + 1) as StepNumber);

  function continueFromDateTime() {
    // Pre-select the theatre requested via deep link if it is free at the chosen time.
    if (!state.theater && state.preferredTheaterId && availability.data) {
      const theater = availability.data.theaters.find((t) => t.id === state.preferredTheaterId);
      const slot = theater?.slots.find(
        (s) => s.startTime === state.startTime && s.status === "AVAILABLE",
      );
      if (theater && slot && theater.maxCapacity >= state.guests) {
        dispatch(selectTheater(theater, slot));
      }
    }
    next();
  }

  function startOver() {
    clearStoredState();
    dispatch({ type: "HYDRATE", state: createInitialState({ today, location: prefill.location }) });
  }

  if (!hydrated) return <WizardSkeleton />;

  const total = previewPrice(state, cartLines(state, addOnsById))?.total ?? 0;
  const showSummary = state.step >= 2 && state.step <= 8;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="print:hidden">
        <Stepper current={state.step} maxReached={state.maxStep} onSelect={go} />
      </div>

      <div
        className={
          showSummary ? "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start" : "mt-8"
        }
      >
        <div
          key={state.step}
          className="animate-fade-in rounded-2xl border border-white/5 bg-ink-900/60 p-5 sm:p-8 print:border-0 print:p-0 [&_h2]:outline-none"
        >
          {state.step === 1 && (
            <DateTimeStep
              state={state}
              dispatch={dispatch}
              locations={locations}
              today={today}
              maxDate={maxDate}
              availability={availability}
              onNext={continueFromDateTime}
            />
          )}
          {state.step === 2 && (
            <TheaterStep
              state={state}
              dispatch={dispatch}
              availability={availability}
              onBack={back}
              onNext={next}
            />
          )}
          {state.step === 3 && (
            <ContactStep state={state} dispatch={dispatch} onBack={back} onNext={next} />
          )}
          {state.step === 4 && (
            <OccasionStep state={state} dispatch={dispatch} onBack={back} onNext={next} />
          )}
          {state.step === 5 && (
            <AddOnStep
              category="CAKE"
              addOns={addOns}
              state={state}
              dispatch={dispatch}
              onBack={back}
              onNext={next}
            />
          )}
          {state.step === 6 && (
            <AddOnStep
              category="DECOR"
              addOns={addOns}
              state={state}
              dispatch={dispatch}
              onBack={back}
              onNext={next}
            />
          )}
          {state.step === 7 && (
            <AddOnStep
              category="GIFT"
              addOns={addOns}
              state={state}
              dispatch={dispatch}
              onBack={back}
              onNext={next}
            />
          )}
          {state.step === 8 && (
            <PaymentStep
              state={state}
              dispatch={dispatch}
              total={total}
              onBack={back}
              onEdit={go}
            />
          )}
          {state.step === 9 && state.booking && (
            <div className="space-y-6">
              <Receipt booking={state.booking} />
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center print:hidden">
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer aria-hidden className="size-4" /> Print receipt
                </Button>
                <Link
                  href={`/booking/confirmation/${state.booking.id}`}
                  className={buttonClasses({ variant: "secondary" })}
                >
                  Open receipt page
                </Link>
                <Button onClick={startOver}>Book another experience</Button>
              </div>
            </div>
          )}
        </div>

        {showSummary && (
          <div className="lg:sticky lg:top-24">
            <OrderSummary state={state} addOnsById={addOnsById} />
          </div>
        )}
      </div>
    </div>
  );
}

export function WizardSkeleton() {
  return (
    <div
      className="flex min-h-80 items-center justify-center gap-2 rounded-2xl border border-white/5 bg-ink-900/60 text-sm text-zinc-400"
      role="status"
    >
      <Spinner className="size-4" /> Loading booking…
    </div>
  );
}
