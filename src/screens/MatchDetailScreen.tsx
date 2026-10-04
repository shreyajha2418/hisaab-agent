import { useState } from 'react';
import { Amount, Box, Button, ChevronLeftIcon, Heading, IconButton, Text, useToast } from '@razorpay/blade/components';
import { AllocationList } from '../components/AllocationList';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { DeductionFlag } from '../components/DeductionFlag';
import { FlagBanner } from '../components/FlagBanner';
import { ThinkingIndicator } from '../components/ThinkingIndicator';
import { useAgentThinking } from '../hooks/useAgentThinking';
import { useAppState } from '../state/AppStateContext';
import { useNav } from '../state/NavContext';
import { aiOutputs, customers } from '../data';
import { getCustomer, getEffectiveAllocation, getEffectiveCustomerId, getSourceInfo } from '../state/selectors';
import { formatShortDate, formatTime } from '../utils/dates';

export function MatchDetailScreen({ eventId }: { eventId: string }) {
  const { state, confirmEvent, undoEvent, changeCustomer, acceptFlag, questionFlag } = useAppState();
  const { back, navigate } = useNav();
  const { show } = useToast();
  const [pickingCustomer, setPickingCustomer] = useState(false);

  const isThinking = useAgentThinking(eventId);
  const out = aiOutputs[eventId];
  const liveStatus = state.events[eventId]?.liveStatus ?? out.status;
  const customerId = getEffectiveCustomerId(state, eventId);
  const customer = customerId ? getCustomer(customerId) : undefined;
  const suggestedCustomer = out.payerMatch.suggestedCustomerId ? getCustomer(out.payerMatch.suggestedCustomerId) : undefined;
  const allocation = getEffectiveAllocation(state, eventId);
  const source = getSourceInfo(out);
  const displayName = customer?.name ?? out.payerMatch.rawLabel ?? 'Unidentified payment';
  const flagResolution = state.flagResolutions[eventId] ?? 'pending';

  // A payer confirms either a matched customer (Verma) or the AI's own
  // suggestion for an unidentified one (RAJESH K) — both are "confirmable".
  const canConfirm = liveStatus === 'needs_confirmation' && !!(customer ?? suggestedCustomer);
  const canUndo = liveStatus === 'auto_recorded' || liveStatus === 'confirmed';

  // A payer is "learned" only the first time an unidentified raw label gets
  // an identity — not on every re-confirm (e.g. after undo already restored
  // the learned entry, so confirming again shouldn't re-toast it).
  const handleConfirm = () => {
    const willLearn = out.payerMatch.customerId === null && !state.events[eventId]?.override && suggestedCustomer;
    confirmEvent(eventId);
    if (willLearn) {
      show({ content: `Remembered: "${out.payerMatch.rawLabel}" → ${suggestedCustomer.name}`, color: 'positive' });
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        gap="spacing.2"
        padding="spacing.4"
        borderBottomWidth="thin"
        borderColor="surface.border.gray.muted"
      >
        <IconButton icon={ChevronLeftIcon} accessibilityLabel="Back" onClick={back} />
        <Heading size="small">{displayName}</Heading>
      </Box>

      {isThinking ? (
        <ThinkingIndicator />
      ) : (
        <Box padding="spacing.6">
          <Box display="flex" alignItems="center" gap="spacing.3" marginBottom="spacing.1">
            <Amount value={out.amount} suffix="none" size="2xlarge" type="heading" />
            <ConfidenceBadge confidence={out.payerMatch.confidence} />
          </Box>
          <Text size="small" color="surface.text.gray.muted">
            {source.channelLabel}
            {source.dateTime && ` · ${formatShortDate(source.dateTime.slice(0, 10))}, ${formatTime(source.dateTime)}`}
          </Text>

          <Box
            marginTop="spacing.5"
            padding="spacing.4"
            backgroundColor="surface.background.gray.moderate"
            borderRadius="medium"
          >
            <Text size="small" color="surface.text.gray.muted">
              Why
            </Text>
            <Text marginTop="spacing.1">{out.payerMatch.reasoning}</Text>
          </Box>

          {out.flags.map((flag, i) =>
            flag.type === 'short_payment' && liveStatus === 'confirmed' ? (
              <DeductionFlag
                key={i}
                flag={flag}
                resolution={flagResolution}
                customerName={displayName}
                onAccept={() => acceptFlag(eventId)}
                onQuestion={() => questionFlag(eventId)}
              />
            ) : (
              <FlagBanner key={i} flag={flag} />
            )
          )}

          {allocation.length > 0 && (
            <Box marginTop="spacing.6">
              <Heading size="small" marginBottom="spacing.2">
                Applied to
              </Heading>
              <AllocationList allocation={allocation} />
            </Box>
          )}

          <Box marginTop="spacing.7" display="flex" flexDirection="column" gap="spacing.3">
            {canConfirm && (
              <Button isFullWidth onClick={handleConfirm}>
                {!customer && suggestedCustomer ? `Yes, this is ${suggestedCustomer.name}` : `Confirm — ${customer?.name}`}
              </Button>
            )}

            {liveStatus === 'needs_confirmation' && (
              <Button variant="secondary" isFullWidth onClick={() => setPickingCustomer((p) => !p)}>
                Change customer
              </Button>
            )}

            {pickingCustomer && (
              <Box borderWidth="thin" borderColor="surface.border.gray.muted" borderRadius="medium">
                {customers.map((c) => (
                  <Box key={c.id} padding="spacing.3" borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                    <Button
                      variant="tertiary"
                      isFullWidth
                      onClick={() => {
                        changeCustomer(eventId, c.id);
                        setPickingCustomer(false);
                      }}
                    >
                      {c.name}
                    </Button>
                  </Box>
                ))}
              </Box>
            )}

            {customer && (
              <Button
                variant="tertiary"
                isFullWidth
                onClick={() => navigate({ name: 'customerDues', customerId: customer.id })}
              >
                View {customer.name}'s dues
              </Button>
            )}

            {canUndo && (
              <Button variant="secondary" isFullWidth onClick={() => undoEvent(eventId)}>
                Undo
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
