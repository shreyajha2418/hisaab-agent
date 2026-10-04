// Core domain types for Hisaab Agent's synthetic data. All amounts are
// plain rupee integers (no paise) — see src/utils/currency.ts for display
// formatting ("₹12,000" style, Indian digit grouping).

export type IdentityType = 'upi' | 'bank';

export interface KnownIdentity {
  type: IdentityType;
  value: string;
  label?: string;
}

export interface Customer {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  knownIdentities: KnownIdentity[];
  paymentHabit: string;
}

export type BillStatus = 'open' | 'paid';

export interface Bill {
  billNumber: string;
  customerId: string;
  date: string; // ISO date, e.g. "2026-09-02"
  amount: number;
  status: BillStatus;
}

export interface RazorpayPayment {
  id: string;
  amount: number;
  time: string; // ISO datetime
  payerUpiId: string;
  payerName: string;
}

export interface RazorpaySettlement {
  utr: string;
  amount: number;
  settledAt: string; // ISO datetime
}

export interface BankStatementLine {
  id: string;
  date: string; // ISO date
  description: string;
  creditAmount: number;
  reference: string;
}

export interface CashVoiceNote {
  id: string;
  recordedAt: string; // ISO datetime
  audioLabel: string;
  transcript: string;
  language: string;
}

export type SourceType = 'razorpay_payment' | 'bank_line' | 'cash_note';

export type Confidence = 'high' | 'medium' | 'low';

export interface PayerMatch {
  customerId: string | null;
  confidence: Confidence;
  reasoning: string;
  suggestedCustomerId?: string;
  /** What actually showed up (e.g. "RAJESH K" from a bank narration) — shown
   *  as the title until the payer is identified/confirmed. Only set when
   *  customerId is null. */
  rawLabel?: string;
}

export interface AllocationLine {
  billNumber: string;
  amountApplied: number;
  remainingOnBill: number;
}

export type FlagType = 'short_payment' | 'overdue' | 'not_customer_payment';

export interface EventFlag {
  type: FlagType;
  message: string;
  shortBy?: number;
}

export type EventStatus = 'auto_recorded' | 'needs_confirmation' | 'set_aside';

export interface AiOutput {
  eventId: string;
  sourceType: SourceType;
  amount: number;
  payerMatch: PayerMatch;
  allocation: AllocationLine[];
  flags: EventFlag[];
  status: EventStatus;
  /** For cash_note events: what the agent extracted from the transcript. */
  extracted?: {
    customerName: string;
    amount: number;
    mode: 'cash';
  };
}

export type AiOutputsMap = Record<string, AiOutput>;
