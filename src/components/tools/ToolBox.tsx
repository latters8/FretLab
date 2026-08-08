// src/components/tools/ToolBox.tsx

import React from 'react';
import EarTrainer from './EarTrainer';
import RecordingAnalyzer from './RecordingAnalyzer';

const ToolBox: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 👂 Ear Trainer */}
      <EarTrainer />

      {/* 🎙️ Recording Analyzer */}
      <RecordingAnalyzer />
    </div>
  );
};

export default ToolBox;

