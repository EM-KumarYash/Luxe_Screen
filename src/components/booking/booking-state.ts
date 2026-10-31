// Booking wizard state: a single reducer so every step reads and writes one
// source of truth, which is also persisted to sessionStorage between reloads.
import type { OccasionKey } from "@/lib/planner";
import type { BookingDTO, PaymentMethod, SlotAvailabilityDTO, TheaterDTO } from "@/types";

export const STEPS = [
  "Date & Time",
  "Theatre",
  "Your Details",
  "Occasion",
  "Cakes",
  "Decor",
  "Gifts",
  "Payment",
  "Confirmed",
] as const;
export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type OccasionDetails = {
  honoreeName?: string;
  partnerName?: string;
  screenMessage?: string;
  age?: number;
};

export type CartEntry = { optionId: string; quantity: number };

export type AppliedCoupon = { code: string; description: string; discount: number };

export type PendingBooking = { id: string; signature: string; holdExpiresAt: string };

export type WizardState = {
  step: StepNumber;
  /** Furthest step reached, so earlier steps can be revisited from the stepper. */
  maxStep: StepNumber;
  location: string;
  date: string;
  guests: number;
  startTime: string | null;
  theater: TheaterDTO | null;
  slot: Omit<SlotAvailabilityDTO, "status"> | null;
  /** Theatre requested via deep link (gallery / planner), pre-selected when available. */
  preferredTheaterId: string | null;
  customer: { name: string; phone: string; email: string };
  occasion: OccasionKey | null;
  occasionDetails: OccasionDetails;
  specialRequests: string;
  /** One chosen option per add-on, keyed by add-on id. */
  cart: Record<string, CartEntry>;
  coupon: AppliedCoupon | null;
  paymentMethod: PaymentMethod;
  pending: PendingBooking | null;
  booking: BookingDTO | null;
};

export type WizardAction =
  | { type: "HYDRATE"; state: WizardState }
  | { type: "GO"; step: StepNumber }
  | { type: "SET_LOCATION"; location: string }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_GUESTS"; guests: number }
  | { type: "SELECT_TIME"; startTime: string }
  | { type: "SELECT_THEATER"; theater: TheaterDTO; slot: Omit<SlotAvailabilityDTO, "status"> }
  | { type: "CLEAR_SLOT" }
  | { type: "SET_CUSTOMER"; customer: WizardState["customer"] }
  | {
      type: "SET_OCCASION";
      occasion: OccasionKey;
      occasionDetails: OccasionDetails;
      specialRequests: string;
    }
  | { type: "SET_CART_ITEM"; addOnId: string; entry: CartEntry | null }
  | { type: "SET_COUPON"; coupon: AppliedCoupon | null }
  | { type: "SET_PAYMENT_METHOD"; method: PaymentMethod }
  | { type: "SET_PENDING"; pending: PendingBooking | null }
  | { type: "CONFIRMED"; booking: BookingDTO };

/** Builds the SELECT_THEATER action from an availability entry (drops the per-slot list). */
export function selectTheater(
  theater: TheaterDTO & { slots: SlotAvailabilityDTO[] },
  slot: SlotAvailabilityDTO,
): WizardAction {
  const { slots, ...dto } = theater;
  const { status, ...slotInfo } = slot;
  return { type: "SELECT_THEATER", theater: dto, slot: slotInfo };
}

export function createInitialState(init: {
  today: string;
  location: string;
  guests?: number;
  occasion?: OccasionKey | null;
  preferredTheaterId?: string | null;
  cart?: Record<string, CartEntry>;
}): WizardState {
  return {
    step: 1,
    maxStep: 1,
    location: init.location,
    date: init.today,
    guests: init.guests ?? 2,
    startTime: null,
    theater: null,
    slot: null,
    preferredTheaterId: init.preferredTheaterId ?? null,
    customer: { name: "", phone: "", email: "" },
    occasion: init.occasion ?? null,
    occasionDetails: {},
    specialRequests: "",
    cart: init.cart ?? {},
    coupon: null,
    paymentMethod: "UPI",
    pending: null,
    booking: null,
  };
}

const clearSlot = { startTime: null, theater: null, slot: null } as const;

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "GO":
      return {
        ...state,
        step: action.step,
        maxStep: Math.max(state.maxStep, action.step) as StepNumber,
      };
    case "SET_LOCATION":
      return action.location === state.location
        ? state
        : { ...state, location: action.location, ...clearSlot };
    case "SET_DATE":
      return action.date === state.date ? state : { ...state, date: action.date, ...clearSlot };
    case "SET_GUESTS": {
      const tooSmall = state.theater && state.theater.maxCapacity < action.guests;
      return {
        ...state,
        guests: action.guests,
        ...(tooSmall ? { theater: null, slot: null } : {}),
      };
    }
    case "SELECT_TIME":
      return action.startTime === state.startTime
        ? state
        : { ...state, startTime: action.startTime, theater: null, slot: null };
    case "SELECT_THEATER":
      return {
        ...state,
        theater: action.theater,
        slot: action.slot,
        startTime: action.slot.startTime,
      };
    case "CLEAR_SLOT":
      return { ...state, ...clearSlot, pending: null, step: 1 };
    case "SET_CUSTOMER":
      return { ...state, customer: action.customer };
    case "SET_OCCASION":
      return {
        ...state,
        occasion: action.occasion,
        occasionDetails: action.occasionDetails,
        specialRequests: action.specialRequests,
      };
    case "SET_CART_ITEM": {
      const cart = { ...state.cart };
      if (action.entry) cart[action.addOnId] = action.entry;
      else delete cart[action.addOnId];
      return { ...state, cart };
    }
    case "SET_COUPON":
      return { ...state, coupon: action.coupon };
    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.method };
    case "SET_PENDING":
      return { ...state, pending: action.pending };
    case "CONFIRMED":
      return { ...state, booking: action.booking, pending: null, step: 9, maxStep: 9 };
  }
}

/** The create-booking payload; also used to detect when a pending hold no longer matches the cart. */
export function toBookingPayload(state: WizardState) {
  return {
    theaterId: state.theater?.id ?? "",
    slotId: state.slot?.id ?? "",
    date: state.date,
    guests: state.guests,
    customer: state.customer,
    occasion: state.occasion ?? "OTHER",
    occasionDetails: state.occasionDetails,
    specialRequests: state.specialRequests || undefined,
    items: Object.values(state.cart).map(({ optionId, quantity }) => ({ optionId, quantity })),
    couponCode: state.coupon?.code,
  };
}

export const STORAGE_KEY = "luxe-booking-v1";

export function loadStoredState(today: string): WizardState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as WizardState;
    if (!state || typeof state.step !== "number") return null;
    // A stale draft from a previous day loses its date and slot.
    if (state.step !== 9 && state.date < today)
      return { ...state, date: today, ...clearSlot, pending: null, step: 1, maxStep: 1 };
    return state;
  } catch {
    return null;
  }
}

export function saveState(state: WizardState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); the wizard still works in memory.
  }
}

export function clearStoredState() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
