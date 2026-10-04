import { Amount, Box, Card, CardBody, Heading, Text } from '@razorpay/blade/components';
import { useAppState } from '../state/AppStateContext';
import { useNav } from '../state/NavContext';
import { getDecisionsWaitingCount, getNeedsConfirmationEvents, getOverdueBills, getTodayByChannel, getTotalOutstanding } from '../state/selectors';

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" paddingY="spacing.3">
      <Text color="surface.text.gray.muted">{label}</Text>
      <Amount value={value} suffix="none" size="medium" type="body" weight="semibold" />
    </Box>
  );
}

export function HomeScreen() {
  const { state } = useAppState();
  const { switchTab } = useNav();

  const byChannel = getTodayByChannel();
  const todayTotal = byChannel.razorpayQr + byChannel.bank + byChannel.cash;
  const decisionsWaiting = getDecisionsWaitingCount(state);
  const matchesToConfirm = getNeedsConfirmationEvents(state).length;
  const overdueCount = getOverdueBills(state).length;
  const totalOutstanding = getTotalOutstanding(state);

  return (
    <Box padding="spacing.6">
      <Text size="small" color="surface.text.gray.muted">
        Shree Ram Pharma Distributors
      </Text>
      <Heading size="large">Today</Heading>

      <Box marginTop="spacing.5">
        <button
          onClick={() => switchTab('decisions')}
          style={{ display: 'block', width: '100%', border: 'none', padding: 0, background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Card>
            <CardBody>
              <Text color="surface.text.gray.muted">
                {decisionsWaiting === 0 ? 'All clear' : `${decisionsWaiting} decision${decisionsWaiting === 1 ? '' : 's'} waiting`}
              </Text>
              <Heading size="2xlarge">{decisionsWaiting}</Heading>
              {decisionsWaiting > 0 && (
                <Text size="small" color="surface.text.gray.muted">
                  {matchesToConfirm > 0 && `${matchesToConfirm} to confirm`}
                  {matchesToConfirm > 0 && overdueCount > 0 && ' · '}
                  {overdueCount > 0 && `${overdueCount} overdue`}
                </Text>
              )}
            </CardBody>
          </Card>
        </button>
      </Box>

      <Box marginTop="spacing.7">
        <Heading size="small" marginBottom="spacing.2">
          Money in today
        </Heading>
        <Card>
          <CardBody>
            <StatRow label="Razorpay QR" value={byChannel.razorpayQr} />
            <StatRow label="Bank transfer" value={byChannel.bank} />
            <StatRow label="Cash" value={byChannel.cash} />
            <Box borderTopWidth="thin" borderColor="surface.border.gray.muted" marginTop="spacing.2" paddingTop="spacing.3">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Text weight="semibold">Total</Text>
                <Amount value={todayTotal} suffix="none" size="medium" type="body" weight="semibold" />
              </Box>
            </Box>
          </CardBody>
        </Card>
      </Box>

      <Box marginTop="spacing.7">
        <Heading size="small" marginBottom="spacing.2">
          Outstanding across all customers
        </Heading>
        <Card>
          <CardBody>
            <Amount value={totalOutstanding} suffix="none" size="xlarge" type="heading" />
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
}
