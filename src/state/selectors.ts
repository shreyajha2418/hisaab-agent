import { aiOutputs, bankStatement, bills, cashVoiceNotes, customers, razorpayPayments } from '../data';
import { daysSince } from '../utils/dates';
import type { AiOutput, Bill, Customer } from '../types';
import type { AppState } from './types';

const OVERDUE_THRESHOLD_DAYS = 30;

export function getCustomer(customerId: string): Customer | undefined {
  return customers.find((c) => c.id === customerId);
}

export function getBill(billNumber: string): Bill | undefined {
  return bills.find((b) => b.billNumber === billNumber);
}

/** Live remaining amount on a bill — 0 for bills already marked 'paid' in
 * the source data (historical, pre-dating the demo), otherwise amount
 * minus whatever confirmed/auto_recorded events have applied so far. */
export function getRemaining(state: AppState, billNumber: string): number {
  const bill = getBill(billNumber);
  if (!bill || bill.status === 'paid') return 0;
  return bill.amount - (state.billPaid[billNumber] ?? 0);
}

export function getDerivedBillStatus(state: AppState, billNumber: string): 'paid' | 'cleared' | 'partial' | 'open' {
  const bill = getBill(billNumber);
  if (!bill) return 'open';
  if (bill.status === 'paid') return 'paid';
  const remaining = getRemaining(state, billNumber);
  if (remaining <= 0) return 'cleared';
  if (remaining < bill.amount) return 'partial';
  return 'open';
}

/** The effective allocation for an event — Aman's manual reassignment
 * (if any) takes over from the pre-computed one. */
export function getEffectiveAllocation(state: AppState, eventId: string) {
  const override = state.events[eventId]?.override;
  if (override) return override.allocation;
  return aiOutputs[eventId].allocation;
}

export function getEffectiveCustomerId(state: AppState, eventId: string): string | null {
  const override = state.events[eventId]?.override;
  if (override) return override.customerId;
  return aiOutputs[eventId].payerMatch.customerId;
}

export interface SourceInfo {
  dateTime: string;
  channelLabel: string;
}

export function getSourceInfo(out: AiOutput): SourceInfo {
  if (out.sourceType === 'razorpay_payment') {
    const p = razorpayPayments.find((x) => x.id === out.eventId);
    return { dateTime: p?.time ?? '', channelLabel: 'Razorpay QR' };
  }
  if (out.sourceType === 'bank_line') {
    const l = bankStatement.find((x) => x.id === out.eventId);
    return { dateTime: l ? `${l.date}T12:00:00+05:30` : '', channelLabel: 'Bank transfer' };
  }
  const v = cashVoiceNotes.find((x) => x.id === out.eventId);
  return { dateTime: v?.recordedAt ?? '', channelLabel: 'Cash' };
}

export interface DecisionEvent {
  eventId: string;
  out: AiOutput;
  liveStatus: string;
  customer: Customer | undefined;
  displayName: string;
  source: SourceInfo;
}

function toDecisionEvent(state: AppState, eventId: string): DecisionEvent {
  const out = aiOutputs[eventId];
  const customerId = getEffectiveCustomerId(state, eventId);
  const customer = customerId ? getCustomer(customerId) : undefined;
  return {
    eventId,
    out,
    liveStatus: state.events[eventId]?.liveStatus ?? out.status,
    customer,
    displayName: customer?.name ?? out.payerMatch.rawLabel ?? 'Unidentified payment',
    source: getSourceInfo(out),
  };
}

export function getAllEvents(state: AppState): DecisionEvent[] {
  return Object.keys(aiOutputs).map((eventId) => toDecisionEvent(state, eventId));
}

export function getNeedsConfirmationEvents(state: AppState): DecisionEvent[] {
  return getAllEvents(state).filter((e) => e.liveStatus === 'needs_confirmation');
}

export function getResolvedEvents(state: AppState): DecisionEvent[] {
  return getAllEvents(state).filter((e) => e.liveStatus === 'auto_recorded' || e.liveStatus === 'confirmed');
}

export function getSetAsideEvents(state: AppState): DecisionEvent[] {
  return getAllEvents(state).filter((e) => e.liveStatus === 'set_aside');
}

export interface OverdueBill {
  bill: Bill;
  customer: Customer | undefined;
  days: number;
  remaining: number;
}

/** Bills already "spoken for" by a pending match — e.g. G-201 is part of
 * the RAJESH K event's allocation, so it shouldn't also surface as its
 * own separate "overdue" decision; confirming that one match resolves it. */
function getBillsInPendingMatches(state: AppState): Set<string> {
  const billNumbers = new Set<string>();
  for (const event of getNeedsConfirmationEvents(state)) {
    for (const line of getEffectiveAllocation(state, event.eventId)) {
      billNumbers.add(line.billNumber);
    }
  }
  return billNumbers;
}

export function getOverdueBills(state: AppState): OverdueBill[] {
  const spokenFor = getBillsInPendingMatches(state);
  return bills
    .filter((b) => b.status === 'open' && !spokenFor.has(b.billNumber))
    .map((bill) => ({
      bill,
      customer: getCustomer(bill.customerId),
      days: daysSince(bill.date),
      remaining: getRemaining(state, bill.billNumber),
    }))
    .filter((b) => b.remaining > 0 && b.days > OVERDUE_THRESHOLD_DAYS);
}

export interface PendingDeductionFlag {
  eventId: string;
  out: AiOutput;
  customer: Customer | undefined;
  displayName: string;
  shortBy: number;
  message: string;
}

/** Confirmed events carrying a short_payment flag Aman hasn't accepted or
 * questioned yet. Only confirmed events are included — an unresolved match
 * shows the flag as informational only, per the PRD's "after confirming"
 * framing; there's nothing to accept/question until the money is recorded. */
export function getPendingDeductionFlags(state: AppState): PendingDeductionFlag[] {
  return getAllEvents(state)
    .filter((e) => e.liveStatus === 'confirmed')
    .flatMap((e) => {
      const flag = e.out.flags.find((f) => f.type === 'short_payment');
      if (!flag || (state.flagResolutions[e.eventId] ?? 'pending') !== 'pending') return [];
      return [
        {
          eventId: e.eventId,
          out: e.out,
          customer: e.customer,
          displayName: e.displayName,
          shortBy: flag.shortBy ?? 0,
          message: flag.message,
        },
      ];
    });
}

export function getDecisionsWaitingCount(state: AppState): number {
  return (
    getNeedsConfirmationEvents(state).length + getOverdueBills(state).length + getPendingDeductionFlags(state).length
  );
}

export function getTotalOutstanding(state: AppState): number {
  return bills.reduce((sum, b) => sum + getRemaining(state, b.billNumber), 0);
}

export interface TodayByChannel {
  razorpayQr: number;
  bank: number;
  cash: number;
}

/** Money that arrived today, by channel — independent of match/confirm
 * status (Aman received it either way), excluding set-aside amounts
 * (settlement/own-deposit/interest aren't new customer money). */
export function getTodayByChannel(): TodayByChannel {
  const razorpayQr = razorpayPayments.reduce((sum, p) => sum + p.amount, 0);

  const setAsideIds = new Set(Object.values(aiOutputs).filter((o) => o.status === 'set_aside').map((o) => o.eventId));
  const bank = bankStatement.filter((l) => !setAsideIds.has(l.id)).reduce((sum, l) => sum + l.creditAmount, 0);

  const cash = cashVoiceNotes.reduce((sum, v) => sum + (aiOutputs[v.id]?.amount ?? 0), 0);

  return { razorpayQr, bank, cash };
}

export function getCustomerOpenBills(state: AppState, customerId: string) {
  return bills
    .filter((b) => b.customerId === customerId && b.status === 'open')
    .map((bill) => ({ bill, remaining: getRemaining(state, bill.billNumber), days: daysSince(bill.date) }))
    .filter((b) => b.remaining > 0);
}

export function getCustomerDues(state: AppState, customerId: string): number {
  return getCustomerOpenBills(state, customerId).reduce((sum, b) => sum + b.remaining, 0);
}

/** Resolved (auto_recorded/confirmed) events currently attributed to this
 * customer — effective customer, so a manually reassigned or confirmed
 * unidentified payment (RAJESH K -> Gupta Pharmacy) shows up under Gupta's
 * dues view, not left out just because the source data never named them. */
export function getCustomerRecentPayments(state: AppState, customerId: string): DecisionEvent[] {
  return getAllEvents(state)
    .filter((e) => (e.liveStatus === 'auto_recorded' || e.liveStatus === 'confirmed') && e.customer?.id === customerId)
    .sort((a, b) => (a.source.dateTime < b.source.dateTime ? 1 : -1));
}
