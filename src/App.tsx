import React from 'react';
import { MusicProvider } from './context/MusicContext';
import AppShell from './components/layout/AppShell';

const App: React.FC = () => {
  return (
    <MusicProvider>
      <AppShell />
    </MusicProvider>
  );
};

export default App;