import { useState } from 'react';
import { Box, Button, Heading, Text } from '@razorpay/blade/components';
import { getCustomer } from '../state/selectors';
import { useAppState } from '../state/AppStateContext';

function SectionHeading({ children }: { children: string }) {
  return (
    <Heading size="small" marginBottom="spacing.2">
      {children}
    </Heading>
  );
}

export function SettingsScreen() {
  const { state, removeLearnedIdentity, reset } = useAppState();
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <Box padding="spacing.6">
      <Heading size="large" marginBottom="spacing.6">
        Settings
      </Heading>

      <Box marginBottom="spacing.8">
        <SectionHeading>Memory</SectionHeading>
        <Text size="small" color="surface.text.gray.muted" marginBottom="spacing.3">
          Payer names Hisaab Agent has learned from your confirmations.
        </Text>
        {state.learnedIdentities.length === 0 ? (
          <Text color="surface.text.gray.muted">Nothing learned yet.</Text>
        ) : (
          <Box borderTopWidth="thin" borderColor="surface.border.gray.muted">
            {state.learnedIdentities.map((l) => {
              const customer = getCustomer(l.customerId);
              return (
                <Box
                  key={l.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="spacing.3"
                  paddingY="spacing.4"
                  borderBottomWidth="thin"
                  borderColor="surface.border.gray.muted"
                >
                  <Text>
                    {l.rawLabel} → {customer?.name ?? l.customerId}
                  </Text>
                  <Button variant="tertiary" size="small" onClick={() => removeLearnedIdentity(l.id)}>
                    Remove
                  </Button>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <Box marginBottom="spacing.8">
        <SectionHeading>Demo</SectionHeading>
        {confirmingReset ? (
          <Box display="flex" flexDirection="column" gap="spacing.3">
            <Text size="small" color="surface.text.gray.muted">
              This clears every confirmation, undo and learned name, back to the starting demo state.
            </Text>
            <Box display="flex" gap="spacing.3">
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  reset();
                  setConfirmingReset(false);
                }}
              >
                Yes, reset demo
              </Button>
              <Button variant="tertiary" size="small" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmingReset(true)}>
            Reset demo
          </Button>
        )}
      </Box>

      <Box>
        <SectionHeading>About</SectionHeading>
        <Text size="small" color="surface.text.gray.muted">
          Prototype: AI outputs are pre-computed from synthetic data.
        </Text>
      </Box>
    </Box>
  );
}
