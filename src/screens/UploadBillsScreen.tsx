import { useState } from 'react';
import {
  Amount,
  Box,
  Button,
  ChevronLeftIcon,
  FileTextIcon,
  Heading,
  IconButton,
  Spinner,
  Text,
  UploadIcon,
} from '@razorpay/blade/components';
import { bills } from '../data';
import { useNav } from '../state/NavContext';

type Stage = 'idle' | 'reading' | 'done';

const OPEN_BILLS = bills.filter((b) => b.status === 'open');
const PAID_BILLS = bills.filter((b) => b.status === 'paid');
const CUSTOMER_COUNT = new Set(bills.map((b) => b.customerId)).size;
const OPEN_TOTAL = OPEN_BILLS.reduce((sum, b) => sum + b.amount, 0);

export function UploadBillsScreen() {
  const { back, switchTab } = useNav();
  const [stage, setStage] = useState<Stage>('idle');

  function upload() {
    setStage('reading');
    setTimeout(() => setStage('done'), 1300);
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
        <Heading size="small">Upload bills</Heading>
      </Box>

      <Box padding="spacing.6" display="flex" flexDirection="column" alignItems="center">
        {stage === 'idle' && (
          <Box display="flex" flexDirection="column" alignItems="center" gap="spacing.5" paddingTop="spacing.9">
            <FileTextIcon size="2xlarge" color="surface.icon.gray.muted" />
            <Text color="surface.text.gray.muted" textAlign="center">
              Upload your outstanding-bills report from your billing software (Excel or CSV). Hisaab Agent reads it,
              removes duplicates, and sets it as the opening balance.
            </Text>
            <Button icon={UploadIcon} size="large" onClick={upload}>
              Upload outstanding_bills.xlsx
            </Button>
          </Box>
        )}

        {stage === 'reading' && (
          <Box paddingTop="spacing.10">
            <Spinner
              accessibilityLabel="Hisaab Agent is reading your bills"
              label="Hisaab Agent is reading your bills…"
              labelPosition="bottom"
              size="large"
              color="primary"
            />
          </Box>
        )}

        {stage === 'done' && (
          <Box width="100%" display="flex" flexDirection="column" gap="spacing.5">
            <Box padding="spacing.4" backgroundColor="surface.background.gray.moderate" borderRadius="medium">
              <Text weight="semibold" marginBottom="spacing.2">
                Loaded
              </Text>
              <Text>
                {OPEN_BILLS.length} open bills from {CUSTOMER_COUNT} customers
              </Text>
              <Text color="surface.text.gray.muted">{PAID_BILLS.length} already-paid bills skipped (duplicates by bill number)</Text>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Text weight="semibold">Opening balance</Text>
              <Amount value={OPEN_TOTAL} suffix="none" size="large" type="heading" />
            </Box>
            <Button isFullWidth onClick={() => switchTab('home')}>
              Done
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
