import { useState } from 'react';
import { Badge, Box, Button, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, Heading, Text } from '@razorpay/blade/components';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { DecisionCard } from '../components/DecisionCard';
import { formatINR } from '../utils/currency';
import { useAppState } from '../state/AppStateContext';
import { useNav } from '../state/NavContext';
import {
  getNeedsConfirmationEvents,
  getOverdueBills,
  getPendingDeductionFlags,
  getResolvedEvents,
  getSetAsideEvents,
} from '../state/selectors';

const SET_ASIDE_LABELS: Record<string, string> = {
  bank_3: 'Razorpay settlement',
  bank_4: 'Your cash deposit',
  bank_5: 'Bank interest',
};

function SectionHeading({ children }: { children: string }) {
  return (
    <Heading size="small" marginBottom="spacing.2">
      {children}
    </Heading>
  );
}

export function DecisionListScreen() {
  const { state, undoEvent } = useAppState();
  const { navigate } = useNav();
  const [showSetAside, setShowSetAside] = useState(false);

  const needsYou = getNeedsConfirmationEvents(state);
  const overdue = getOverdueBills(state);
  const deductionFlags = getPendingDeductionFlags(state);
  const done = getResolvedEvents(state);
  const setAside = getSetAsideEvents(state);

  return (
    <Box padding="spacing.6">
      <Heading size="large" marginBottom="spacing.6">
        Decisions
      </Heading>

      <Box marginBottom="spacing.8">
        <SectionHeading>Needs you</SectionHeading>
        {needsYou.length === 0 && overdue.length === 0 && deductionFlags.length === 0 ? (
          <Box display="flex" alignItems="center" gap="spacing.2" paddingY="spacing.2">
            <CheckCircleIcon color="feedback.icon.positive.intense" size="medium" />
            <Text color="surface.text.gray.muted">Nothing waiting — you're all caught up.</Text>
          </Box>
        ) : (
          <Box borderTopWidth="thin" borderColor="surface.border.gray.muted">
            {needsYou.map((e) => (
              <Box key={e.eventId} borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                <DecisionCard
                  title={e.displayName}
                  subtitle={
                    e.out.sourceType === 'cash_note'
                      ? 'Cash — tap to confirm'
                      : e.customer
                        ? 'Tap to re-confirm'
                        : 'Who is this? Tap to review'
                  }
                  amount={e.out.amount}
                  badge={<ConfidenceBadge confidence={e.out.payerMatch.confidence} />}
                  onClick={() => navigate({ name: 'matchDetail', eventId: e.eventId })}
                />
              </Box>
            ))}
            {overdue.map(({ bill, customer, days, remaining }) => (
              <Box key={bill.billNumber} borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                <DecisionCard
                  title={customer?.name ?? bill.customerId}
                  subtitle={`${bill.billNumber} — ${days} days overdue`}
                  amount={remaining}
                  badge={<Badge color="negative">Overdue</Badge>}
                  onClick={() => navigate({ name: 'customerDues', customerId: bill.customerId })}
                />
              </Box>
            ))}
            {deductionFlags.map((f) => (
              <Box key={f.eventId} borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                <DecisionCard
                  title={f.displayName}
                  subtitle={`${formatINR(f.shortBy)} short — tap to review`}
                  amount={f.out.amount}
                  badge={<Badge color="notice">Flagged</Badge>}
                  onClick={() => navigate({ name: 'matchDetail', eventId: f.eventId })}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box marginBottom="spacing.8">
        <SectionHeading>Done automatically</SectionHeading>
        {done.length === 0 ? (
          <Text color="surface.text.gray.muted">Nothing resolved yet.</Text>
        ) : (
          <Box borderTopWidth="thin" borderColor="surface.border.gray.muted">
            {done.map((e) => (
              <Box key={e.eventId} borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                <DecisionCard
                  title={e.displayName}
                  subtitle={e.source.channelLabel}
                  amount={e.out.amount}
                  onClick={() => navigate({ name: 'matchDetail', eventId: e.eventId })}
                  trailing={
                    <Button variant="tertiary" size="small" onClick={() => undoEvent(e.eventId)}>
                      Undo
                    </Button>
                  }
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box>
        <button
          onClick={() => setShowSetAside((s) => !s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer',
            font: 'inherit',
            color: 'inherit',
          }}
        >
          <SectionHeading>Set aside (not customer payments)</SectionHeading>
          {showSetAside ? <ChevronUpIcon size="small" /> : <ChevronDownIcon size="small" />}
        </button>
        {showSetAside && (
          <Box borderTopWidth="thin" borderColor="surface.border.gray.muted">
            {setAside.map((e) => (
              <Box key={e.eventId} borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                <DecisionCard
                  title={SET_ASIDE_LABELS[e.eventId] ?? 'Not a customer payment'}
                  subtitle={e.out.flags[0]?.message}
                  amount={e.out.amount}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
