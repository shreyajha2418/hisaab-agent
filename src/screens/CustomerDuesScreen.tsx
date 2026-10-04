import { Amount, Badge, Box, ChevronLeftIcon, Heading, IconButton, Text } from '@razorpay/blade/components';
import { DecisionCard } from '../components/DecisionCard';
import { useAppState } from '../state/AppStateContext';
import { useNav } from '../state/NavContext';
import { getCustomer, getCustomerDues, getCustomerOpenBills, getCustomerRecentPayments } from '../state/selectors';
import { formatShortDate } from '../utils/dates';

const OVERDUE_THRESHOLD_DAYS = 30;

export function CustomerDuesScreen({ customerId }: { customerId: string }) {
  const { state } = useAppState();
  const { back, navigate } = useNav();

  const customer = getCustomer(customerId);
  const totalDues = getCustomerDues(state, customerId);
  const openBills = getCustomerOpenBills(state, customerId);
  const recentPayments = getCustomerRecentPayments(state, customerId);

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
        <Heading size="small">{customer?.name ?? customerId}</Heading>
      </Box>

      <Box padding="spacing.6">
        {customer && (
          <Text size="small" color="surface.text.gray.muted" marginBottom="spacing.5">
            Owner: {customer.ownerName} · {customer.phone}
          </Text>
        )}

        <Box padding="spacing.4" backgroundColor="surface.background.gray.moderate" borderRadius="medium" marginBottom="spacing.7">
          <Text size="small" color="surface.text.gray.muted">
            Total owed
          </Text>
          <Amount value={totalDues} suffix="none" size="2xlarge" type="heading" />
        </Box>

        <Box marginBottom="spacing.7">
          <Heading size="small" marginBottom="spacing.2">
            Open bills
          </Heading>
          {openBills.length === 0 ? (
            <Text color="surface.text.gray.muted">Nothing open — fully paid up.</Text>
          ) : (
            <Box borderTopWidth="thin" borderColor="surface.border.gray.muted">
              {openBills.map(({ bill, remaining, days }) => (
                <Box key={bill.billNumber} borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                  <DecisionCard
                    title={bill.billNumber}
                    subtitle={`${formatShortDate(bill.date)} · ${days} days ago`}
                    amount={remaining}
                    badge={days > OVERDUE_THRESHOLD_DAYS && remaining > 0 ? <Badge color="negative">Overdue</Badge> : undefined}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box>
          <Heading size="small" marginBottom="spacing.2">
            Recent payments
          </Heading>
          {recentPayments.length === 0 ? (
            <Text color="surface.text.gray.muted">No payments recorded yet.</Text>
          ) : (
            <Box borderTopWidth="thin" borderColor="surface.border.gray.muted">
              {recentPayments.map((e) => (
                <Box key={e.eventId} borderBottomWidth="thin" borderColor="surface.border.gray.muted">
                  <DecisionCard
                    title={e.source.channelLabel}
                    subtitle={formatShortDate(e.source.dateTime.slice(0, 10))}
                    amount={e.out.amount}
                    onClick={() => navigate({ name: 'matchDetail', eventId: e.eventId })}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
