// src/components/layout/AppShell.tsx
import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useMetronome } from '../../hooks/useMetronome';
import Header from './Header';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import styles from './AppShell.module.css';

const AppShell: React.FC = () => {
  const { bpm } = useMusic();
  const { isPlaying, currentStep } = useMetronome(bpm);

  return (
    <div className={styles.appShell}>
      <Header />
      
      <main className={styles.mainContent}>
        <section className={styles.fretboardSection}>
          <Fretboard />
        </section>
        
        <section className={styles.tablatureSection}>
          <Tablature activeStep={isPlaying ? currentStep : -1} />
        </section>
      </main>
    </div>
  );
};

export default AppShell;