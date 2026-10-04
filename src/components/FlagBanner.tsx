import { Alert, Box } from '@razorpay/blade/components';
import type { EventFlag } from '../types';

const INTENT: Record<EventFlag['type'], 'notice' | 'neutral'> = {
  short_payment: 'notice',
  overdue: 'notice',
  not_customer_payment: 'neutral',
};

export function FlagBanner({ flag }: { flag: EventFlag }) {
  return (
    <Box marginTop="spacing.4">
      <Alert
        color={INTENT[flag.type]}
        description={flag.message}
        isDismissible={false}
        isFullWidth
      />
    </Box>
  );
}
