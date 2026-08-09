import type React from 'react';
import { MusicProvider } from './context/MusicContext';
import { LocaleProvider } from './context/LocaleContext';
import AppShell from './components/layout/AppShell';

const App: React.FC = () => {
  return (
    <LocaleProvider>
      <MusicProvider>
        <AppShell />
      </MusicProvider>
    </LocaleProvider>
  );
};

export default App;