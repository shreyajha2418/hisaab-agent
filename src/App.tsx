import styled, { keyframes } from 'styled-components';
import { Box, ToastContainer } from '@razorpay/blade/components';
import { PhoneFrame } from './components/PhoneFrame';
import { BottomNav } from './components/BottomNav';
import { AppStateProvider } from './state/AppStateContext';
import { NavProvider, useNav } from './state/NavContext';
import { HomeScreen } from './screens/HomeScreen';
import { DecisionListScreen } from './screens/DecisionListScreen';
import { MatchDetailScreen } from './screens/MatchDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AddCashScreen } from './screens/AddCashScreen';
import { UploadBillsScreen } from './screens/UploadBillsScreen';
import { CustomerDuesScreen } from './screens/CustomerDuesScreen';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Remounted on every route change (keyed by route identity below), so the
// animation restarts on each navigation — a lightweight way to make
// switching screens feel like an app rather than a page swap, without a
// routing/animation library this single-stack nav doesn't need.
const Transition = styled.div`
  animation: ${fadeIn} 180ms ease-out;
`;

function Screens() {
  const { route } = useNav();
  const showBottomNav = route.name === 'home' || route.name === 'decisions' || route.name === 'settings';
  const routeKey = route.name + ('eventId' in route ? route.eventId : '') + ('customerId' in route ? route.customerId : '');

  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      <Box flex="1" paddingBottom={showBottomNav ? 'spacing.11' : 'spacing.0'}>
        <Transition key={routeKey}>
          {route.name === 'home' && <HomeScreen />}
          {route.name === 'decisions' && <DecisionListScreen />}
          {route.name === 'matchDetail' && <MatchDetailScreen eventId={route.eventId} />}
          {route.name === 'settings' && <SettingsScreen />}
          {route.name === 'addCash' && <AddCashScreen />}
          {route.name === 'uploadBills' && <UploadBillsScreen />}
          {route.name === 'customerDues' && <CustomerDuesScreen customerId={route.customerId} />}
        </Transition>
      </Box>
      {showBottomNav && <BottomNav />}
    </Box>
  );
}

function App() {
  return (
    <PhoneFrame>
      <AppStateProvider>
        <NavProvider>
          <Screens />
          <ToastContainer offsetBottom={72} />
        </NavProvider>
      </AppStateProvider>
    </PhoneFrame>
  );
}

export default App;
