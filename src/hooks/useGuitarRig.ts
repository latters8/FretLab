import { useState, useEffect, useCallback, useRef } from 'react';
import type { RigParams, ParamKey, Preset } from '../types/rig';
import { DEFAULT_PARAMS } from '../types/rig';
import { GuitarRig } from '../audio/GuitarRig';
import { FACTORY_PRESETS } from '../audio/presets';

const CUSTOM_PRESETS_KEY = 'fretlab_custom_presets';

export function useGuitarRig(initialParams: Partial<RigParams> = {}) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [params, setParams] = useState<RigParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const rigRef = useRef<GuitarRig | null>(null);

  // Инициализация
  useEffect(() => {
    const rig = new GuitarRig(params);
    rigRef.current = rig;

    rig.init()
      .then(() => setIsReady(true))
      .catch((err) => console.error('[useGuitarRig] Init failed:', err));

    return () => {
      rig.dispose();
      rigRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Синхронизация параметров
  useEffect(() => {
    const rig = rigRef.current;
    if (!rig || !rig.initialized) return;
    (Object.keys(params) as ParamKey[]).forEach((key) => {
      rig.setParam(key, params[key]);
    });
  }, [params]);

  // Сохранение кастомных пресетов
  useEffect(() => {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(customPresets));
  }, [customPresets]);

  const toggle = useCallback(async () => {
    const rig = rigRef.current;
    if (!rig || !rig.initialized) return;

    if (isPlaying) {
      rig.stop();
      setIsPlaying(false);
    } else {
      try {
        await rig.start();
        setIsPlaying(true);
      } catch (err) {
        console.error('[useGuitarRig] Start failed:', err);
        alert('Разрешите доступ к микрофону');
      }
    }
  }, [isPlaying]);

  const updateParam = useCallback(<K extends ParamKey>(key: K, value: RigParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadPreset = useCallback((name: string) => {
    const factory = FACTORY_PRESETS.find((p) => p.name === name);
    const custom = customPresets.find((p) => p.name === name);
    const preset = factory || custom;

    if (!preset) {
      console.warn(`[useGuitarRig] Preset "${name}" not found`);
      return;
    }

    setParams((prev) => ({
      ...prev,
      ...preset.params,
    }));
  }, [customPresets]);

  const savePreset = useCallback((name: string) => {
    setCustomPresets((prev) => {
      const filtered = prev.filter((p) => p.name !== name);
      return [
        ...filtered,
        {
          name,
          category: 'custom',
          params: { ...params },
        },
      ];
    });
  }, [params]);

  const deletePreset = useCallback((name: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.name !== name));
  }, []);

  const getAllPresets = useCallback(() => {
    return [...FACTORY_PRESETS, ...customPresets];
  }, [customPresets]);

  const getFFT = useCallback((): Float32Array => {
    return rigRef.current?.getFFT() ?? new Float32Array(2048);
  }, []);

  const getWaveform = useCallback((): Float32Array => {
    return rigRef.current?.getWaveform() ?? new Float32Array(2048);
  }, []);

  const getReduction = useCallback((): number => {
    return rigRef.current?.getReduction() ?? 0;
  }, []);

  return {
    isReady,
    isPlaying,
    toggle,
    params,
    updateParam,
    loadPreset,
    savePreset,
    deletePreset,
    getAllPresets,
    getFFT,
    getWaveform,
    getReduction,
    rig: rigRef,
  };
}