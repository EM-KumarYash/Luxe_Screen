// Pure pricing rules shared by the API (authoritative) and the UI (preview).
// All amounts are integer paise.

export type PricedTheater = {
  basePrice: number;
  includedGuests: number;
  extraGuestPrice: number;
};

export type PricedItem = { price: number; quantity: number };

export type CouponRule = {
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export type CouponRejection =
  "INACTIVE" | "NOT_STARTED" | "EXPIRED" | "USAGE_LIMIT_REACHED" | "MIN_ORDER_NOT_MET";

export type CouponResult =
  { valid: true; discount: number } | { valid: false; reason: CouponRejection; message: string };

export type PriceBreakdown = {
  theaterAmount: number;
  extraGuestAmount: number;
  addOnsAmount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
};

export function extraGuestCharge(theater: PricedTheater, guests: number): number {
  return Math.max(0, guests - theater.includedGuests) * theater.extraGuestPrice;
}

export function addOnsTotal(items: PricedItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function evaluateCoupon(
  coupon: CouponRule,
  subtotal: number,
  now: Date = new Date(),
): CouponResult {
  if (!coupon.isActive) {
    return { valid: false, reason: "INACTIVE", message: "This coupon is no longer active." };
  }
  if (now < coupon.validFrom) {
    return { valid: false, reason: "NOT_STARTED", message: "This coupon is not active yet." };
  }
  if (now > coupon.validUntil) {
    return { valid: false, reason: "EXPIRED", message: "This coupon has expired." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      reason: "USAGE_LIMIT_REACHED",
      message: "This coupon has been fully redeemed.",
    };
  }
  if (subtotal < coupon.minOrderAmount) {
    const min = Math.round(coupon.minOrderAmount / 100).toLocaleString("en-IN");
    return {
      valid: false,
      reason: "MIN_ORDER_NOT_MET",
      message: `Add items worth ₹${min} or more to use this coupon.`,
    };
  }

  let discount =
    coupon.discountType === "PERCENT"
      ? Math.floor((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  // Round down to whole rupees and never discount more than the order.
  discount = Math.min(Math.floor(discount / 100) * 100, subtotal);

  return { valid: true, discount };
}

export function calculatePrice(input: {
  theater: PricedTheater;
  guests: number;
  items: PricedItem[];
  discountAmount?: number;
}): PriceBreakdown {
  const theaterAmount = input.theater.basePrice;
  const extraGuestAmount = extraGuestCharge(input.theater, input.guests);
  const addOnsAmount = addOnsTotal(input.items);
  const subtotal = theaterAmount + extraGuestAmount + addOnsAmount;
  const discountAmount = Math.min(input.discountAmount ?? 0, subtotal);
  return {
    theaterAmount,
    extraGuestAmount,
    addOnsAmount,
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
  };
}
