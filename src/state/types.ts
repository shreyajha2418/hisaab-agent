import type { AllocationLine, EventStatus } from '../types';

// An event's live status extends the data's baseline EventStatus with the
// two outcomes a human action produces: confirming a needs_confirmation
// event moves it to 'confirmed'; undoing any applied event moves it back
// to 'needs_confirmation' (whatever it started as, it now needs a human
// to look at it again).
export type LiveEventStatus = EventStatus | 'confirmed';

export interface EventOverride {
  customerId: string;
  allocation: AllocationLine[];
}

export interface EventState {
  liveStatus: LiveEventStatus;
  /** Set when Aman picks a different customer via "Change customer" — the
   *  freshly-computed (not pre-computed) allocation replaces ai_outputs'. */
  override?: EventOverride;
}

/** A payer identity the agent has learned from a confirmation — e.g.
 *  "RAJESH K" → Gupta Pharmacy. Shown on the Memory screen, removable. */
export interface LearnedIdentity {
  id: string;
  rawLabel: string;
  customerId: string;
}

export type FlagResolution = 'pending' | 'accepted' | 'questioned';

export interface AppState {
  /** billNumber -> cumulative amount applied to it by confirmed/auto_recorded events. */
  billPaid: Record<string, number>;
  events: Record<string, EventState>;
  learnedIdentities: LearnedIdentity[];
  /** eventId -> how its short_payment flag (if any) was resolved. Absent means 'pending'. */
  flagResolutions: Record<string, FlagResolution>;
}
