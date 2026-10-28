import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';
import App from './App.tsx';
import './index.css';

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

createRoot(document.getElementById('root')!).render(
  <TonConnectUIProvider
    manifestUrl={manifestUrl}
    uiPreferences={{
      theme: THEME.DARK,
      borderRadius: 'm',
      colorsSet: {
        [THEME.DARK]: {
          accent: '#00e5ff',
          telegramButton: '#0088cc',
          background: {
            primary: '#0a1628',
            secondary: '#081322',
          },
          text: {
            primary: '#ffffff',
            secondary: '#94a3b8',
          },
        },
      },
    }}
  >
    <App />
  </TonConnectUIProvider>
);
