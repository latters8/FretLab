import { useState } from 'react';
import type { Preset, PresetCategory } from '../../types/rig';
import { getAllCategories } from '../../audio/presets';

interface PresetPanelProps {
  presets: Preset[];
  currentParams: Record<string, any>;
  onLoad: (name: string) => void;
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
}

const CATEGORY_COLORS: Record<PresetCategory, string> = {
  clean: '#22c55e',
  crunch: '#f59e0b',
  'high-gain': '#ef4444',
  ambient: '#8b5cf6',
  custom: '#06b6d4',
};

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  clean: 'Clean',
  crunch: 'Crunch',
  'high-gain': 'High Gain',
  ambient: 'Ambient',
  custom: 'Custom',
};

export const PresetPanel: React.FC<PresetPanelProps> = ({
  presets,
  currentParams,
  onLoad,
  onSave,
  onDelete,
}) => {
  const [activeCategory, setActiveCategory] = useState<PresetCategory | 'all'>('all');
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const filtered = activeCategory === 'all'
    ? presets
    : presets.filter((p) => p.category === activeCategory);

  const categories = ['all', ...getAllCategories()] as const;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: '1px solid #333',
              background: activeCategory === cat ? '#333' : '#1a1a1a',
              color: activeCategory === cat ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
          </button>
        ))}
        <button
          onClick={() => setShowSave((v) => !v)}
          style={{
            padding: '6px 14px',
            borderRadius: 4,
            border: '1px solid #06b6d4',
            background: showSave ? '#06b6d4' : 'transparent',
            color: showSave ? '#000' : '#06b6d4',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            marginLeft: 'auto',
          }}
        >
          + SAVE
        </button>
      </div>

      {/* Save form */}
      {showSave && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Preset name..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#1a1a1a',
              color: '#eee',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={() => {
              if (saveName.trim()) {
                onSave(saveName.trim());
                setSaveName('');
                setShowSave(false);
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              background: '#22c55e',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            SAVE
          </button>
        </div>
      )}

      {/* Preset grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filtered.map((preset) => {
          const color = CATEGORY_COLORS[preset.category];
          const isCustom = preset.category === 'custom';

          return (
            <div
              key={preset.name}
              style={{
                position: 'relative',
                padding: '10px 14px',
                borderRadius: 6,
                border: `1px solid ${color}44`,
                background: '#1a1a1a',
                cursor: 'pointer',
                minWidth: 140,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = color;
                (e.currentTarget as HTMLDivElement).style.background = `${color}11`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${color}44`;
                (e.currentTarget as HTMLDivElement).style.background = '#1a1a1a';
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {CATEGORY_LABELS[preset.category]}
              </div>
              <div style={{ fontSize: 13, color: '#eee', fontWeight: 500 }}>
                {preset.name}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoad(preset.name);
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: 3,
                    border: 'none',
                    background: color,
                    color: '#000',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  LOAD
                </button>
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${preset.name}"?`)) {
                        onDelete(preset.name);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 3,
                      border: '1px solid #ef4444',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};