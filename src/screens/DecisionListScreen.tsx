import { useState } from 'react';
import { Badge, Box, Button, Heading, Text } from '@razorpay/blade/components';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { DecisionCard } from '../components/DecisionCard';
import { useAppState } from '../state/AppStateContext';
import { useNav } from '../state/NavContext';
import {
  getNeedsConfirmationEvents,
  getOverdueBills,
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
  const done = getResolvedEvents(state);
  const setAside = getSetAsideEvents(state);

  return (
    <Box padding="spacing.6">
      <Heading size="large" marginBottom="spacing.6">
        Decisions
      </Heading>

      <Box marginBottom="spacing.8">
        <SectionHeading>Needs you</SectionHeading>
        {needsYou.length === 0 && overdue.length === 0 ? (
          <Text color="surface.text.gray.muted">Nothing waiting — you're all caught up.</Text>
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
          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}
        >
          <SectionHeading>{`Set aside (not customer payments) ${showSetAside ? '▾' : '▸'}`}</SectionHeading>
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
