// API contract types shared by route handlers and the UI.
// All amounts are integer paise; dates are "YYYY-MM-DD" (IST); times are "HH:mm".

import type { OccasionKey } from "@/lib/planner";
import type { PriceBreakdown } from "@/lib/pricing";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "LOCATION_UNAVAILABLE"
  | "DATE_OUT_OF_RANGE"
  | "SLOT_CLOSED"
  | "SLOT_UNAVAILABLE"
  | "CAPACITY_EXCEEDED"
  | "ADDON_UNAVAILABLE"
  | "COUPON_INVALID"
  | "BOOKING_NOT_PAYABLE"
  | "HOLD_EXPIRED"
  | "PAYMENT_FAILED"
  | "ALREADY_ON_WAITLIST";

export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; details?: unknown };
};

export type LocationStatus = "ACTIVE" | "COMING_SOON";
export type AddOnCategory = "CAKE" | "DECOR" | "GIFT";
export type PaymentMethod = "UPI" | "CARD" | "NET_BANKING";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type Occasion = OccasionKey;

export type LocationDTO = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string | null;
  status: LocationStatus;
};

export type TheaterDTO = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  basePrice: number;
  includedGuests: number;
  extraGuestPrice: number;
  maxCapacity: number;
  screen: string;
  sound: string;
  images: string[];
  amenities: string[];
  rating: number;
  location: { slug: string; name: string; city: string };
};

export type AddOnOptionDTO = { id: string; name: string; price: number };

export type AddOnDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AddOnCategory;
  image: string;
  options: AddOnOptionDTO[];
};

export type SlotStatus = "AVAILABLE" | "BOOKED" | "CLOSED";

export type SlotAvailabilityDTO = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
};

export type AvailabilityDTO = {
  date: string;
  theaters: (TheaterDTO & { slots: SlotAvailabilityDTO[] })[];
};

export type CouponValidationDTO = {
  code: string;
  description: string;
  discount: number;
  quote: PriceBreakdown;
};

export type BookingItemDTO = {
  addOnName: string;
  category: AddOnCategory;
  optionName: string;
  price: number;
  quantity: number;
};

export type BookingDTO = {
  id: string;
  reference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentRef: string | null;
  date: string;
  guests: number;
  customer: { name: string; phone: string; email: string };
  occasion: Occasion;
  occasionDetails: Record<string, string | number> | null;
  specialRequests: string | null;
  theater: { id: string; slug: string; name: string; image: string | null };
  location: { name: string; city: string; address: string | null };
  slot: { id: string; label: string; startTime: string; endTime: string };
  items: BookingItemDTO[];
  coupon: { code: string } | null;
  price: PriceBreakdown;
  holdExpiresAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type PlannerRecommendationDTO = {
  theater: TheaterDTO;
  theaterCost: number;
  items: {
    addOnId: string;
    addOnName: string;
    category: AddOnCategory;
    optionId: string;
    optionName: string;
    price: number;
  }[];
  total: number;
  withinBudget: boolean;
  score: number;
  reasons: string[];
};

export type PlannerResponseDTO = {
  recommendation: PlannerRecommendationDTO | null;
  alternatives: PlannerRecommendationDTO[];
};
