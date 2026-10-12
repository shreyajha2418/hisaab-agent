import { Alert, Box, Button, Text, WhatsAppIcon } from '@razorpay/blade/components';
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
      <Box
        marginTop="spacing.4"
        padding="spacing.3"
        backgroundColor="feedback.background.positive.subtle"
        borderWidth="thin"
        borderColor="interactive.border.positive.faded"
        borderRadius="medium"
      >
        <Text size="small" weight="semibold">
          Message sent to {customerName} on WhatsApp
        </Text>
        <Text size="small" marginTop="spacing.1">
          {`Hi ${customerName}, this payment was ${formatINR(flag.shortBy ?? 0)} short — was that a deduction?`}
        </Text>
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
        <Button variant="tertiary" size="small" icon={WhatsAppIcon} onClick={onQuestion}>
          Ask on WhatsApp
        </Button>
      </Box>
    </Box>
  );
}
