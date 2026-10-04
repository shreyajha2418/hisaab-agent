import { Amount, Box, Divider, Text } from '@razorpay/blade/components';
import type { AllocationLine } from '../types';
import { getBill } from '../state/selectors';
import { formatShortDate } from '../utils/dates';

export function AllocationList({ allocation }: { allocation: AllocationLine[] }) {
  if (allocation.length === 0) return null;

  return (
    <Box borderWidth="thin" borderColor="surface.border.gray.muted" borderRadius="medium">
      {allocation.map((line, i) => {
        const bill = getBill(line.billNumber);
        return (
          <Box key={line.billNumber}>
            {i > 0 && <Divider />}
            <Box
              padding="spacing.4"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap="spacing.2"
            >
              <Box>
                <Text weight="semibold">{line.billNumber}</Text>
                {bill && (
                  <Text size="small" color="surface.text.gray.muted">
                    {formatShortDate(bill.date)}
                  </Text>
                )}
              </Box>
              <Box display="flex" flexDirection="column" alignItems="flex-end">
                <Amount value={line.amountApplied} suffix="none" size="medium" type="body" weight="semibold" />
                {line.remainingOnBill > 0 && (
                  <Text size="xsmall" color="feedback.text.notice.intense">
                    ₹{line.remainingOnBill.toLocaleString('en-IN')} still pending
                  </Text>
                )}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
