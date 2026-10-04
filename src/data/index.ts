import type {
  AiOutputsMap,
  BankStatementLine,
  Bill,
  CashVoiceNote,
  Customer,
  RazorpayPayment,
  RazorpaySettlement,
} from '../types';

import customersRaw from './customers.json';
import billsRaw from './bills.json';
import razorpayPaymentsRaw from './razorpay_payments.json';
import razorpaySettlementsRaw from './razorpay_settlements.json';
import bankStatementRaw from './bank_statement.json';
import cashVoiceNoteRaw from './cash_voice_note.json';
import aiOutputsRaw from './ai_outputs.json';

// JSON string literals are widened to `string` by TypeScript, so union-typed
// fields (e.g. BillStatus) need a cast here rather than `satisfies` — the
// cast is the type-check itself: if a JSON file's shape drifts from
// src/types, this stops compiling.
export const customers = customersRaw as unknown as Customer[];
export const bills = billsRaw as unknown as Bill[];
export const razorpayPayments = razorpayPaymentsRaw as unknown as RazorpayPayment[];
export const razorpaySettlements = razorpaySettlementsRaw as unknown as RazorpaySettlement[];
export const bankStatement = bankStatementRaw as unknown as BankStatementLine[];
export const cashVoiceNotes = cashVoiceNoteRaw as unknown as CashVoiceNote[];
export const aiOutputs = aiOutputsRaw as unknown as AiOutputsMap;
