import { Box, Spinner } from '@razorpay/blade/components';

export function ThinkingIndicator() {
  return (
    <Box display="flex" justifyContent="center" paddingTop="spacing.10" paddingBottom="spacing.10">
      <Spinner
        accessibilityLabel="Hisaab Agent is matching"
        label="Hisaab Agent is matching…"
        labelPosition="bottom"
        size="large"
        color="primary"
      />
    </Box>
  );
}
