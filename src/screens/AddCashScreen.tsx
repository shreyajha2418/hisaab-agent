import { useState } from 'react';
import {
  Amount,
  Box,
  Button,
  ChevronLeftIcon,
  Heading,
  IconButton,
  MicIcon,
  Spinner,
  Text,
} from '@razorpay/blade/components';
import { aiOutputs, cashVoiceNotes } from '../data';
import { useNav } from '../state/NavContext';
import { getCustomer } from '../state/selectors';
import { formatTime } from '../utils/dates';

type Stage = 'idle' | 'recording' | 'transcribed' | 'thinking' | 'matched';

// This demo has exactly one voice note scenario (Verma, ₹8,000 cash) —
// matches the PRD's own demo moment. Tapping "record" always replays it,
// since there's no backend to accept an arbitrary new one.
const NOTE = cashVoiceNotes[0];
const OUT = aiOutputs[NOTE.id];

export function AddCashScreen() {
  const { back, navigate } = useNav();
  const [stage, setStage] = useState<Stage>('idle');

  const customer = getCustomer(OUT.payerMatch.customerId ?? '');

  function startRecording() {
    setStage('recording');
    setTimeout(() => setStage('transcribed'), 1300);
  }

  function matchIt() {
    setStage('thinking');
    setTimeout(() => setStage('matched'), 1300);
  }

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
        <Heading size="small">Add cash</Heading>
      </Box>

      <Box padding="spacing.6" display="flex" flexDirection="column" alignItems="center">
        {stage === 'idle' && (
          <Box display="flex" flexDirection="column" alignItems="center" gap="spacing.5" paddingTop="spacing.9">
            <Text color="surface.text.gray.muted" textAlign="center">
              Got cash from a customer? Send a quick voice note — "Verma ne 8000 cash diye" — and Hisaab Agent will
              match it.
            </Text>
            <Button icon={MicIcon} size="large" onClick={startRecording}>
              Record voice note
            </Button>
          </Box>
        )}

        {stage === 'recording' && (
          <Box display="flex" flexDirection="column" alignItems="center" gap="spacing.4" paddingTop="spacing.10">
            <Spinner accessibilityLabel="Recording" label="Recording…" labelPosition="bottom" size="large" />
          </Box>
        )}

        {(stage === 'transcribed' || stage === 'thinking' || stage === 'matched') && (
          <Box width="100%" display="flex" flexDirection="column" gap="spacing.5">
            <Box padding="spacing.4" backgroundColor="surface.background.gray.moderate" borderRadius="medium">
              <Text size="small" color="surface.text.gray.muted">
                {NOTE.audioLabel} · {formatTime(NOTE.recordedAt)}
              </Text>
              <Text marginTop="spacing.2" size="large">
                "{NOTE.transcript}"
              </Text>
            </Box>

            {stage === 'transcribed' && (
              <Button isFullWidth onClick={matchIt}>
                Match it
              </Button>
            )}

            {stage === 'thinking' && (
              <Box display="flex" justifyContent="center" paddingY="spacing.6">
                <Spinner
                  accessibilityLabel="Hisaab Agent is matching"
                  label="Hisaab Agent is matching…"
                  labelPosition="bottom"
                  size="large"
                  color="primary"
                />
              </Box>
            )}

            {stage === 'matched' && (
              <Box display="flex" flexDirection="column" gap="spacing.4">
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Text weight="semibold">{customer?.name ?? 'Unidentified'}</Text>
                  <Amount value={OUT.amount} suffix="none" size="large" type="heading" />
                </Box>
                <Text size="small" color="surface.text.gray.muted">
                  {OUT.payerMatch.reasoning}
                </Text>
                <Button isFullWidth onClick={() => navigate({ name: 'matchDetail', eventId: NOTE.id })}>
                  Review match
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
