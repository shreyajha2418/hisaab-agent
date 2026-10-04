import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { aiOutputs } from '../data';
import { allocateOldestFirst } from '../utils/allocate';
import { getCustomerOpenBills } from './selectors';
import type { AppState, EventState } from './types';

type Action =
  | { type: 'CONFIRM_EVENT'; eventId: string }
  | { type: 'UNDO_EVENT'; eventId: string }
  | { type: 'CHANGE_CUSTOMER'; eventId: string; customerId: string }
  | { type: 'RESET' };

function getInitialState(): AppState {
  const billPaid: Record<string, number> = {};
  const events: Record<string, EventState> = {};

  for (const out of Object.values(aiOutputs)) {
    events[out.eventId] = { liveStatus: out.status };
    if (out.status === 'auto_recorded') {
      for (const line of out.allocation) {
        billPaid[line.billNumber] = (billPaid[line.billNumber] ?? 0) + line.amountApplied;
      }
    }
  }

  return { billPaid, events };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CONFIRM_EVENT': {
      const out = aiOutputs[action.eventId];
      const existingOverride = state.events[action.eventId]?.override;
      const allocation = existingOverride?.allocation ?? out.allocation;
      const billPaid = { ...state.billPaid };
      for (const line of allocation) {
        billPaid[line.billNumber] = (billPaid[line.billNumber] ?? 0) + line.amountApplied;
      }
      // Confirming accepts whoever is currently shown — if that's the AI's
      // own suggestion (payerMatch.customerId was never set) rather than a
      // manual reassignment, record it as an override too, so the event
      // resolves to that customer's name from here on instead of staying
      // unidentified forever.
      const override =
        existingOverride ??
        (out.payerMatch.customerId === null && out.payerMatch.suggestedCustomerId
          ? { customerId: out.payerMatch.suggestedCustomerId, allocation: out.allocation }
          : undefined);
      return {
        billPaid,
        events: { ...state.events, [action.eventId]: { liveStatus: 'confirmed', override } },
      };
    }

    case 'UNDO_EVENT': {
      const out = aiOutputs[action.eventId];
      const allocation = state.events[action.eventId]?.override?.allocation ?? out.allocation;
      const billPaid = { ...state.billPaid };
      for (const line of allocation) {
        billPaid[line.billNumber] = Math.max(0, (billPaid[line.billNumber] ?? 0) - line.amountApplied);
      }
      // Undo reverts fully to the original, unconfirmed state — including
      // forgetting any manual "Change customer" reassignment — so Aman can
      // reconsider from the AI's original suggestion again.
      return {
        billPaid,
        events: { ...state.events, [action.eventId]: { liveStatus: 'needs_confirmation' } },
      };
    }

    case 'CHANGE_CUSTOMER': {
      const openBills = getCustomerOpenBills(state, action.customerId).map((b) => ({
        billNumber: b.bill.billNumber,
        date: b.bill.date,
        remaining: b.remaining,
      }));
      const out = aiOutputs[action.eventId];
      const allocation = allocateOldestFirst(out.amount, openBills);
      return {
        ...state,
        events: {
          ...state.events,
          [action.eventId]: { liveStatus: 'needs_confirmation', override: { customerId: action.customerId, allocation } },
        },
      };
    }

    case 'RESET':
      return getInitialState();

    default:
      return state;
  }
}

interface AppStateContextValue {
  state: AppState;
  confirmEvent: (eventId: string) => void;
  undoEvent: (eventId: string) => void;
  changeCustomer: (eventId: string, customerId: string) => void;
  reset: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  const confirmEvent = useCallback((eventId: string) => dispatch({ type: 'CONFIRM_EVENT', eventId }), []);
  const undoEvent = useCallback((eventId: string) => dispatch({ type: 'UNDO_EVENT', eventId }), []);
  const changeCustomer = useCallback(
    (eventId: string, customerId: string) => dispatch({ type: 'CHANGE_CUSTOMER', eventId, customerId }),
    []
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value = useMemo(
    () => ({ state, confirmEvent, undoEvent, changeCustomer, reset }),
    [state, confirmEvent, undoEvent, changeCustomer, reset]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
