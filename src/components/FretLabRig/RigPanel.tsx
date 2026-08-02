/**
 * 🎛️ RigPanel — унифицированный гитарный процессор для всех страниц
 *
 * React-порт предоставленной "FretLab Worklet Rig" педалборды:
 * - SVG-ручки (драг вертикально)
 * - Педали: Noise Gate, Tube Drive, Amp EQ, Cabinet IR, Delay, Reverb, Master
 * - FFT-визуализация
 * - Загрузка IR (.wav / .aif / .aiff)
 * - START / STOP
 *
 * Использует синглтон `fretLabRig` (src/services/FretLabRig.ts).
 */
import React, { useEffect, useRef, useState } from 'react';
import { fretLabRig, FretLabRig } from '../../services/FretLabRig';
import './RigPanel.css';

// ============================================
// 🎚️ КОНФИГУРАЦИЯ ПЕДАЛЕЙ
// ============================================

interface KnobConfig {
  label: string;
  param: string;
  min: number;
  max: number;
  step: number;
  def: number;
  size?: number;
}

interface PedalConfig {
  id: string;
  title: string;
  className: string;
  knobs: KnobConfig[];
  ir?: boolean;
}

const PEDALS: PedalConfig[] = [
  {
    id: 'gate',
    title: 'Noise Gate',
    className: 'gate',
    knobs: [
      { label: 'Thresh', param: 'gateThreshold', min: -80, max: -20, step: 1, def: -50 },
      { label: 'Attack', param: 'gateAttack', min: 0.5, max: 20, step: 0.5, def: 2 },
    ],
  },
  {
    id: 'drive',
    title: 'Tube Drive',
    className: 'drive',
    knobs: [
      { label: 'Drive', param: 'drive', min: 0, max: 100, step: 1, def: 20 },
      { label: 'Tube', param: 'tubeAmount', min: 0, max: 100, step: 1, def: 30 },
    ],
  },
  {
    id: 'eq',
    title: 'Amp EQ',
    className: 'eq',
    knobs: [
      { label: 'Bass', param: 'bass', min: -12, max: 12, step: 0.5, def: 0 },
      { label: 'Mid', param: 'mid', min: -12, max: 12, step: 0.5, def: 0 },
      { label: 'Treble', param: 'treble', min: -12, max: 12, step: 0.5, def: 0 },
    ],
  },
  {
    id: 'cab',
    title: 'Cabinet IR',
    className: 'cab',
    ir: true,
    knobs: [],
  },
  {
    id: 'delay',
    title: 'Delay',
    className: 'delay',
    knobs: [
      { label: 'Time', param: 'delayTime', min: 0, max: 100, step: 1, def: 30 },
      { label: 'Fdbk', param: 'delayFeedback', min: 0, max: 90, step: 1, def: 30 },
      { label: 'Mix', param: 'delayMix', min: 0, max: 100, step: 1, def: 20 },
    ],
  },
  {
    id: 'reverb',
    title: 'Reverb',
    className: 'reverb',
    knobs: [
      { label: 'Decay', param: 'reverbDecay', min: 0, max: 100, step: 1, def: 20 },
      { label: 'Mix', param: 'reverbMix', min: 0, max: 100, step: 1, def: 15 },
    ],
  },
  {
    id: 'master',
    title: 'Master',
    className: 'master',
    knobs: [
      { label: 'Volume', param: 'masterGain', min: 0, max: 200, step: 1, def: 100, size: 60 },
    ],
  },
];

// ============================================
// 🎚️ SVG РУЧКА
// ============================================

interface KnobProps {
  config: KnobConfig;
}

const KnobControl: React.FC<KnobProps> = ({ config }) => {
  const [value, setValue] = useState<number>(config.def);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const size = config.size ?? 50;
  const radius = (size - 8) / 2 - 2;
  const center = size / 2;
  const pct = Math.max(0, Math.min(1, (value - config.min) / (config.max - config.min)));
  const angle = -135 + pct * 270;
  const rad = ((angle - 90) * Math.PI) / 180;
  const ix = center + (radius - 6) * Math.cos(rad);
  const iy = center + (radius - 6) * Math.sin(rad);
  const arc = (270 / 360) * 2 * Math.PI * radius;

  const applyValue = (next: number) => {
    const clamped = Math.max(config.min, Math.min(config.max, next));
    const stepped = Math.round(clamped / config.step) * config.step;
    setValue(stepped);
    fretLabRig.setParam(config.param as any, stepped);
  };

  const handleStart = (clientY: number) => {
    setDragging(true);
    startYRef.current = clientY;
    startValRef.current = value;
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta = (startYRef.current - clientY) * (config.max - config.min) / 150;
      applyValue(startValRef.current + delta);
    };
    const handleEnd = () => setDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return (
    <div className="rig-knob-wrap">
      <svg
        ref={svgRef}
        className="rig-knob"
        width={size}
        height={size}
        data-min={config.min}
        data-max={config.max}
        data-step={config.step}
        data-param={config.param}
        onMouseDown={(e) => handleStart(e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          handleStart(e.touches[0].clientY);
        }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#222"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${2 * Math.PI * radius}`}
          transform={`rotate(-135 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#555"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${pct * arc} ${2 * Math.PI * radius}`}
          transform={`rotate(-135 ${center} ${center})`}
        />
        <circle cx={ix} cy={iy} r="3.5" fill="#ddd" />
      </svg>
      <label>{config.label}</label>
      <span className="rig-knob-val">{value}</span>
    </div>
  );
};

// ============================================
// 🎚️ ПАНЕЛЬ
// ============================================

export const RigPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [pedalStates, setPedalStates] = useState<Record<string, boolean>>({
    gate: true,
    drive: true,
    eq: true,
    cab: true,
    delay: true,
    reverb: true,
    master: true,
  });
  const [irName, setIrName] = useState('Default');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // ─── START / STOP ───
  const handleToggle = async () => {
    if (isRunning) {
      fretLabRig.stop();
      setIsRunning(false);
      return;
    }
    try {
      await fretLabRig.init();
      await fretLabRig.start();
      setIsRunning(true);
    } catch (err) {
      console.error('[RigPanel] Start failed:', err);
      alert('Разрешите доступ к микрофону');
    }
  };

  // ─── FFT ВИЗУАЛИЗАЦИЯ ───
  useEffect(() => {
    if (!isRunning) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      const data = fretLabRig.getFrequencyData();
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, w, h);
      if (data.length === 0) return;
      const barW = w / data.length;
      for (let i = 0; i < data.length; i++) {
        const bh = (data[i] / 255) * h;
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(i * barW, h - bh, barW - 0.5, bh);
      }
    };
    render();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  // ─── ПЕДАЛИ ───
  const togglePedal = (id: string) => {
    setPedalStates((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      fretLabRig.togglePedal(id, next[id]);
      return next;
    });
  };

  // ─── IR LOADER ───
  const handleIRChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIrName(file.name);
    try {
      const arrayBuf = await file.arrayBuffer();
      const tmpCtx = new OfflineAudioContext(1, 1, 44100);
      const audioBuf = await tmpCtx.decodeAudioData(arrayBuf);
      const ir = await FretLabRig.processIR(audioBuf);
      fretLabRig.loadIR(ir);
    } catch (err) {
      console.error('[RigPanel] IR load failed:', err);
    }
  };

  return (
    <section className={`rig-panel ${collapsed ? 'rig-collapsed' : ''}`}>
      {/* HEADER */}
      <div className="rig-top">
        <div className="rig-title">
          <span className="rig-title-icon">🎸</span>
          <span>FRETLAB RIG</span>
          <span className="rig-status">128-sample buffer • ~3 ms • AudioWorklet</span>
        </div>
        <div className="rig-controls">
          <button
            className={`rig-start ${isRunning ? 'active' : ''}`}
            onClick={handleToggle}
          >
            {isRunning ? '⏹ STOP' : '▶ START'}
          </button>
          <button
            className="rig-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Развернуть риг' : 'Свернуть риг'}
          >
            {collapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* COLLAPSED: only strip */}
      {collapsed && (
        <div className="rig-collapsed-strip">
          <span className={`rig-led ${isRunning ? 'on' : ''}`} />
          <span className="rig-collapsed-text">
            {isRunning ? 'Rig active — нажмите ▲ для настроек' : 'Rig stopped — нажмите ▲'}
          </span>
        </div>
      )}

      {/* EXPANDED: canvas + board */}
      {!collapsed && (
        <>
          <canvas ref={canvasRef} className="rig-viz" width={900} height={140} />

          <div className="rig-board">
            {PEDALS.map((pedal) => (
              <div
                key={pedal.id}
                className={`rig-pedal ${pedalStates[pedal.id] ? 'on' : ''} ${pedal.className}`}
                data-pedal={pedal.id}
              >
                <div className="rig-screw tl" />
                <div className="rig-screw tr" />
                <div className="rig-screw bl" />
                <div className="rig-screw br" />
                <div className="rig-led" />
                <h3>{pedal.title}</h3>

                {pedal.ir ? (
                  <>
                    <label className="rig-ir-file">
                      <input
                        type="file"
                        accept=".wav,.ir,.aif,.aiff"
                        style={{ display: 'none' }}
                        onChange={handleIRChange}
                      />
                      📁 Load IR
                    </label>
                    <div className="rig-ir-name">{irName}</div>
                  </>
                ) : (
                  pedal.knobs.map((knob) => (
                    <KnobControl key={knob.param} config={knob} />
                  ))
                )}

                <button className="rig-bypass" onClick={() => togglePedal(pedal.id)}>
                  {pedalStates[pedal.id] ? 'On' : 'Off'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

