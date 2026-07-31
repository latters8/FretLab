import type React from 'react';
import { MusicProvider } from './context/MusicContext';
import AppShell from './components/layout/AppShell';
import { PedalBoard } from './components/PedalBoard';

const App: React.FC = () => {
  return (
    <MusicProvider>
      <AppShell />
      <PedalBoard />
    </MusicProvider>
  );
};

export default App;