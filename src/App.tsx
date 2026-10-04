import { Box, Heading, Text, Button, Amount } from '@razorpay/blade/components';
import { PhoneFrame } from './components/PhoneFrame';

function App() {
  return (
    <PhoneFrame>
      <Box padding="spacing.6">
        <Heading size="large">Hisaab Agent</Heading>
        <Box marginTop="spacing.3">
          <Text>Blade smoke test — if this renders styled, the provider works.</Text>
        </Box>
        <Box marginTop="spacing.4">
          <Amount value={14600} size="xlarge" type="heading" />
        </Box>
        <Box marginTop="spacing.4">
          <Button>Looks good</Button>
        </Box>
      </Box>
    </PhoneFrame>
  );
}

export default App;
