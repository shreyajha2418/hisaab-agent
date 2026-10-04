import type { AllocationLine } from '../types';

export interface AllocatableBill {
  billNumber: string;
  date: string;
  remaining: number;
}

/**
 * Oldest-bills-first allocation — the one piece of genuinely rule-based
 * (non-AI) logic in this prototype, per the PRD's F4: "the oldest bills
 * clear first, and any remainder stays open on the next bill." Used when
 * Aman manually reassigns a payment to a different customer via "Change
 * customer" — that combination can't be pre-computed since he could pick
 * any of the 5 customers, so it's actually computed instead of looked up.
 */
export function allocateOldestFirst(amount: number, openBills: AllocatableBill[]): AllocationLine[] {
  const sorted = [...openBills].filter((b) => b.remaining > 0).sort((a, b) => a.date.localeCompare(b.date));
  let left = amount;
  const allocation: AllocationLine[] = [];

  for (const bill of sorted) {
    if (left <= 0) break;
    const applied = Math.min(left, bill.remaining);
    allocation.push({ billNumber: bill.billNumber, amountApplied: applied, remainingOnBill: bill.remaining - applied });
    left -= applied;
  }

  return allocation;
}
