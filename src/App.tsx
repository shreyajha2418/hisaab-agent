import { Box, ToastContainer } from '@razorpay/blade/components';
import { PhoneFrame } from './components/PhoneFrame';
import { BottomNav } from './components/BottomNav';
import { AppStateProvider } from './state/AppStateContext';
import { NavProvider, useNav } from './state/NavContext';
import { HomeScreen } from './screens/HomeScreen';
import { DecisionListScreen } from './screens/DecisionListScreen';
import { MatchDetailScreen } from './screens/MatchDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';

function Screens() {
  const { route } = useNav();
  const showBottomNav = route.name === 'home' || route.name === 'decisions' || route.name === 'settings';

  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      <Box flex="1" paddingBottom={showBottomNav ? 'spacing.11' : 'spacing.0'}>
        {route.name === 'home' && <HomeScreen />}
        {route.name === 'decisions' && <DecisionListScreen />}
        {route.name === 'matchDetail' && <MatchDetailScreen eventId={route.eventId} />}
        {route.name === 'settings' && <SettingsScreen />}
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
