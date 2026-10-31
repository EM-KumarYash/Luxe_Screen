const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats an amount in paise as Indian rupees, e.g. 149900 -> "₹1,499". */
export function formatINR(paise: number): string {
  return inrFormatter.format(Math.round(paise / 100));
}

export const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);
