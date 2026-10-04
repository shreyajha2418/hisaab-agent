import { Alert, Box, Button, Text } from '@razorpay/blade/components';
import { formatINR } from '../utils/currency';
import type { EventFlag } from '../types';
import type { FlagResolution } from '../state/types';

interface DeductionFlagProps {
  flag: EventFlag;
  resolution: FlagResolution;
  customerName: string;
  onAccept: () => void;
  onQuestion: () => void;
}

export function DeductionFlag({ flag, resolution, customerName, onAccept, onQuestion }: DeductionFlagProps) {
  if (resolution === 'accepted') {
    return (
      <Box marginTop="spacing.4">
        <Alert
          color="positive"
          title="Accepted"
          description={`${formatINR(flag.shortBy ?? 0)} written off as a likely deduction.`}
          isDismissible={false}
          isFullWidth
        />
      </Box>
    );
  }

  if (resolution === 'questioned') {
    return (
      <Box marginTop="spacing.4" padding="spacing.4" borderWidth="thin" borderColor="surface.border.gray.muted" borderRadius="medium">
        <Text size="small" color="surface.text.gray.muted" marginBottom="spacing.2">
          Ready to send to {customerName}
        </Text>
        <Box padding="spacing.3" backgroundColor="surface.background.gray.moderate" borderRadius="medium">
          <Text size="small">
            {`Hi ${customerName}, this payment is ${formatINR(flag.shortBy ?? 0)} short of the bills it was matched to. Could you confirm if this was a deduction (e.g. an expiry return)?`}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box marginTop="spacing.4">
      <Alert color="notice" title="Short payment" description={flag.message} isDismissible={false} isFullWidth />
      <Box display="flex" gap="spacing.3" marginTop="spacing.3">
        <Button variant="secondary" size="small" onClick={onAccept}>
          Accept
        </Button>
        <Button variant="tertiary" size="small" onClick={onQuestion}>
          Question it
        </Button>
      </Box>
    </Box>
  );
}
