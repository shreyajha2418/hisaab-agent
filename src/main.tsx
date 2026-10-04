import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BladeProvider } from '@razorpay/blade/components';
import { bladeTheme } from '@razorpay/blade/tokens';
import '@razorpay/blade/fonts.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BladeProvider themeTokens={bladeTheme} colorScheme="light">
      <App />
    </BladeProvider>
  </StrictMode>
);
