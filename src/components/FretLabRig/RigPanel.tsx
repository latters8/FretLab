/**
 * 🎛️ RigPanel — унифицированный гитарный процессор для всех страниц
 *
 * React-порт предоставленной "FretLab Worklet Rig" педалборды:
 * - SVG-ручки (драг вертикально), единый стиль 2×2 (по 4 ручки на педаль)
 * - Педали: Noise Gate, Tube Drive, Amp EQ, Cabinet IR, Modulation,
 *   Delay, Reverb, Master
 * - Modulation: Chorus / Flanger / Phaser / Tremolo / Vibrato
 * - FFT-визуализация + индикатор уровня входного сигнала (RMS)
 * - Загрузка IR (.wav / .aif / .aiff) + автозагрузка IR по умолчанию
 * - START / STOP с прогрессом, inline-ошибками, индикацией устройства
 *
 * Использует синглтон `fretLabRig` (src/services/FretLabRig.ts).
 */
import React, { useEffect, useRef, useState } from 'react';
import { fretLabRig, FretLabRig } from '../../services/FretLabRig';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import TunerPedal from './TunerPedal';
import './RigPanel.css';

type RigError =
  | { kind: 'permission'; message: string }
  | { kind: 'no-device'; message: string }
  | { kind: 'context'; message: string }
  | { kind: 'unknown'; message: string };

/** Преобразует DOMException из getUserMedia в понятный тип ошибки. */
function classifyMediaError(err: unknown): RigError {
  if (err instanceof Error) {
    const name = (err as Error & { name?: string }).name ?? '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return {
        kind: 'permission',
        message: 'Доступ к микрофону запрещён. Разрешите его в адресной строке браузера и нажмите START ещё раз.',
      };
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      return {
        kind: 'no-device',
        message: 'Микрофон не найден. Подключите аудио-интерфейс или микрофон и попробуйте снова.',
      };
    }
    if (name === 'NotReadableError' || name === 'AbortError') {
      return {
        kind: 'context',
        message: 'Микрофон уже используется другим приложением. Закройте его и попробуйте снова.',
      };
    }
    return { kind: 'unknown', message: err.message || 'Не удалось запустить риг.' };
  }
  return { kind: 'unknown', message: 'Неизвестная ошибка при запуске рига.' };
}

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

interface SelectConfig {
  param: string;
  options: string[];
  def: number;
}

interface PedalConfig {
  id: string;
  title: string;
  className: string;
  knobs: KnobConfig[];
  select?: SelectConfig;
  ir?: boolean;
}

const PEDALS: PedalConfig[] = [
  {
    id: 'tuner',
    title: 'Tuner',
    className: 'tuner',
    knobs: [],
  },
  {
    id: 'gate',
    title: 'Noise Gate',
    className: 'gate',
    knobs: [
      { label: 'Thresh', param: 'gateThreshold', min: -80, max: -20, step: 1, def: -50 },
      { label: 'Attack', param: 'gateAttack', min: 0.5, max: 20, step: 0.5, def: 2 },
      { label: 'Release', param: 'gateRelease', min: 5, max: 200, step: 5, def: 40 },
      { label: 'Depth', param: 'gateDepth', min: 0, max: 100, step: 1, def: 100 },
    ],
  },
  {
    id: 'drive',
    title: 'Tube Drive',
    className: 'drive',
    knobs: [
      { label: 'Drive', param: 'drive', min: 0, max: 100, step: 1, def: 20 },
      { label: 'Tube', param: 'tubeAmount', min: 0, max: 100, step: 1, def: 30 },
      { label: 'Tone', param: 'driveTone', min: 0, max: 100, step: 1, def: 100 },
      { label: 'Level', param: 'driveLevel', min: 0, max: 100, step: 1, def: 100 },
    ],
  },
  {
    id: 'dist',
    title: 'High Gain',
    className: 'dist',
    knobs: [
      { label: 'Gain', param: 'dist', min: 0, max: 100, step: 1, def: 40 },
      { label: 'Tone', param: 'distTone', min: 0, max: 100, step: 1, def: 60 },
      { label: 'Satur', param: 'distSaturation', min: 0, max: 100, step: 1, def: 50 },
      { label: 'Level', param: 'distLevel', min: 0, max: 100, step: 1, def: 100 },
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
      { label: 'Presence', param: 'presence', min: -12, max: 12, step: 0.5, def: 0 },
    ],
  },
  {
    id: 'cab',
    title: 'Cabinet IR',
    className: 'cab',
    ir: true,
    knobs: [
      { label: 'Level', param: 'cabLevel', min: 0, max: 100, step: 1, def: 100 },
      { label: 'Mix', param: 'cabMix', min: 0, max: 100, step: 1, def: 100 },
      { label: 'Tone', param: 'cabTone', min: 0, max: 100, step: 1, def: 100 },
      { label: 'Air', param: 'cabAir', min: 0, max: 100, step: 1, def: 0 },
    ],
  },
  {
    id: 'mod',
    title: 'Modulation',
    className: 'mod',
    select: {
      param: 'modType',
      options: ['Chorus', 'Flanger', 'Phaser', 'Tremolo', 'Vibrato'],
      def: 0,
    },
    knobs: [
      { label: 'Rate', param: 'modRate', min: 0, max: 100, step: 1, def: 20 },
      { label: 'Depth', param: 'modDepth', min: 0, max: 100, step: 1, def: 30 },
      { label: 'Fdbk', param: 'modFeedback', min: 0, max: 90, step: 1, def: 20 },
      { label: 'Mix', param: 'modMix', min: 0, max: 100, step: 1, def: 50 },
    ],
  },
  {
    id: 'delay',
    title: 'Delay',
    className: 'delay',
    knobs: [
      { label: 'Time', param: 'delayTime', min: 0, max: 100, step: 1, def: 30 },
      { label: 'Fdbk', param: 'delayFeedback', min: 0, max: 90, step: 1, def: 30 },
      { label: 'Mix', param: 'delayMix', min: 0, max: 100, step: 1, def: 20 },
      { label: 'Tone', param: 'delayTone', min: 0, max: 100, step: 1, def: 100 },
    ],
  },
  {
    id: 'reverb',
    title: 'Reverb',
    className: 'reverb',
    knobs: [
      { label: 'Decay', param: 'reverbDecay', min: 0, max: 100, step: 1, def: 20 },
      { label: 'Mix', param: 'reverbMix', min: 0, max: 100, step: 1, def: 15 },
      { label: 'PreDly', param: 'reverbPreDelay', min: 0, max: 100, step: 1, def: 0 },
      { label: 'Damp', param: 'reverbDamping', min: 0, max: 100, step: 1, def: 0 },
    ],
  },
  {
    id: 'master',
    title: 'Master',
    className: 'master',
    knobs: [
      { label: 'Volume', param: 'masterGain', min: 0, max: 200, step: 1, def: 100, size: 60 },
      { label: 'Tone', param: 'masterTone', min: 0, max: 100, step: 1, def: 50 },
      { label: 'Drive', param: 'masterDrive', min: 0, max: 100, step: 1, def: 0 },
      { label: 'Limit', param: 'masterLimit', min: 0, max: 100, step: 1, def: 0 },
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
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<RigError | null>(null);
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const [audioContextState, setAudioContextState] = useState<AudioContextState | null>(null);
  const [pedalStates, setPedalStates] = useState<Record<string, boolean>>({
    tuner: true,
    gate: true,
    drive: true,
    dist: false,
    eq: true,
    cab: true,
    mod: false,
    delay: true,
    reverb: true,
    master: true,
  });
const [irName, setIrName] = useState('IR-meza.wav');
const [peakLevel, setPeakLevel] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // ─── START / STOP ───
  const handleToggle = async () => {
    if (isRunning) {
      fretLabRig.stop();
      setIsRunning(false);
      setPeakLevel(0);
      setDeviceLabel(null);
      setAudioContextState(null);
      return;
    }
    setError(null);
    setIsStarting(true);
    try {
      await fretLabRig.init();
      await fretLabRig.start();
      setIsRunning(true);
      // Снимаем мету устройства и состояние контекста сразу после старта
      setDeviceLabel(fretLabRig.getInputDeviceLabel());
      setAudioContextState(fretLabRig.getAudioContextState());
    } catch (err) {
      console.error('[RigPanel] Start failed:', err);
      setError(classifyMediaError(err));
    } finally {
      setIsStarting(false);
    }
  };

  // ─── Периодический опрос audio context state (для 'suspended' после suspend вне рига) ───
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      const s = fretLabRig.getAudioContextState();
      if (s && s !== audioContextState) setAudioContextState(s);
    }, 2000);
    return () => clearInterval(id);
  }, [isRunning, audioContextState]);

  // ─── Попытка возобновить контекст, если браузер его заблокировал ───
  const handleResume = async () => {
    await fretLabRig.resumeContext();
    setAudioContextState(fretLabRig.getAudioContextState());
  };

  // ─── КОМПАКТНЫЙ UV-МЕТР (лёгкий, только RMS + сглаживание) ───
  useEffect(() => {
    if (!isRunning) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const level = fretLabRig.getInputLevelRMS();
      setPeakLevel((prev) => {
        // быстрый подъём, медленный спад
        const next = level > prev ? level : prev * 0.92;
        return Math.max(0, Math.min(1, next));
      });
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [isRunning]);

  // ─── ПЕДАЛИ ───
  const togglePedal = (id: string) => {
    setPedalStates((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      fretLabRig.togglePedal(id, next[id]);
      return next;
    });
  };

  // ─── МОДУЛЯЦИЯ: выбор типа ───
  const handleModTypeChange = (pedal: PedalConfig, value: number) => {
    if (pedal.select) {
      fretLabRig.setParam(pedal.select.param as any, value);
    }
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
          <div className="rig-title-text">
            <span className="rig-title-name">FretLab Rig</span>
            <span className="rig-status">
              {isRunning ? (
                <>
                  <span className="rig-led on" aria-hidden="true" />
                  Active{deviceLabel ? ` · ${deviceLabel}` : ''}
                  {!collapsed && ' · AudioWorklet · 128 samples'}
                </>
              ) : (
                <>
                  <span className="rig-led" aria-hidden="true" />
                  {collapsed
                    ? 'Stopped — нажмите ▲ для настроек'
                    : 'Stopped · AudioWorklet · 128 samples'}
                </>
              )}
            </span>
          </div>
        </div>
        <div className="rig-controls">
          <Button
            variant={isRunning ? 'danger' : 'primary'}
            size="md"
            onClick={handleToggle}
            disabled={isStarting}
            loading={isStarting}
            aria-label={isRunning ? 'Stop rig' : 'Start rig'}
            iconLeft={isStarting ? undefined : isRunning ? '⏹' : '▶'}
          >
            {isStarting ? 'Starting…' : isRunning ? 'Stop' : 'Start'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand rig' : 'Collapse rig'}
            aria-pressed={collapsed}
            title={collapsed ? 'Развернуть риг' : 'Свернуть риг'}
          >
            {collapsed ? '▲ Expand' : '▼ Collapse'}
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && !isRunning && (
        <div
          role="alert"
          className={`rig-error rig-error--${error.kind}`}
        >
          <span className="rig-error-icon" aria-hidden="true">
            {error.kind === 'permission' ? '🔒' :
             error.kind === 'no-device' ? '🎤' :
             error.kind === 'context' ? '⚠️' : '❌'}
          </span>
          <div className="rig-error-text">
            <strong>
              {error.kind === 'permission' ? 'Нет доступа к микрофону' :
               error.kind === 'no-device' ? 'Микрофон не найден' :
               error.kind === 'context' ? 'Микрофон занят' :
               'Ошибка запуска'}
            </strong>
            <span>{error.message}</span>
          </div>
          <button
            className="rig-error-dismiss"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            title="Закрыть"
          >
            ✕
          </button>
        </div>
      )}

      {/* SUSPENDED CONTEXT WARNING */}
      {isRunning && audioContextState === 'suspended' && (
        <div role="alert" className="rig-warning">
          <span aria-hidden="true">⏸</span>
          <span>
            Браузер приостановил аудио (autoplay policy). Нажмите{' '}
            <button className="rig-warning-btn" onClick={handleResume}>
              Resume
            </button>{' '}
            чтобы продолжить.
          </span>
        </div>
      )}

      {/* EXPANDED: UV meter + board */}
      {!collapsed && (
        <>
          {/* Компактный LED UV-метр в стиле 500-серии (ряд с педалями) */}
          <div className="rig-uvmeter" aria-label="Input level meter">
            <div className="rig-uvmeter-label">IN</div>
            <div className="rig-uvmeter-cells">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className={`rig-uv-cell ${peakLevel * 16 > i ? 'on' : ''} ${i < 10 ? 'green' : i < 13 ? 'yellow' : 'red'}`}
                />
              ))}
            </div>
            <div className="rig-uvmeter-num">{Math.round(peakLevel * 100)}</div>
            {!isRunning && (
              <span className="rig-uvmeter-hint">— нажмите Start для измерения</span>
            )}
          </div>

          <div className="rig-board">
            {PEDALS.map((pedal) => {
              if (pedal.id === 'tuner') {
                return (
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
                    <TunerPedal isRunning={isRunning} active={pedalStates[pedal.id]} onRequestStart={handleToggle} />
                    <button className="rig-bypass" onClick={() => togglePedal(pedal.id)}>
                      {pedalStates[pedal.id] ? 'On' : 'Off'}
                    </button>
                  </div>
                );
              }

              return (
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

                  {pedal.select && (
                    <select
                      className="rig-mod-select"
                      defaultValue={pedal.select.def}
                      onChange={(e) => handleModTypeChange(pedal, Number(e.target.value))}
                    >
                      {pedal.select.options.map((opt, i) => (
                        <option key={opt} value={i}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {pedal.ir && (
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
                  )}

                  {pedal.knobs.length > 0 && (
                    <div className="rig-knobs">
                      {pedal.knobs.map((knob) => (
                        <KnobControl key={knob.param} config={knob} />
                      ))}
                    </div>
                  )}

                  <button className="rig-bypass" onClick={() => togglePedal(pedal.id)}>
                    {pedalStates[pedal.id] ? 'On' : 'Off'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};

