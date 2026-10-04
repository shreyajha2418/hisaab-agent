// Indian digit grouping ("₹12,000", "₹1,50,000") for plain-text contexts
// (toasts, composed sentences). For numbers rendered in the UI, prefer
// Blade's <Amount value={n} suffix="none" /> — this is for strings only.
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
