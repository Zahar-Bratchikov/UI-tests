import React from 'react';

export type Mocks = Record<string, any>;

export function MocksPanel({ mocks, onSelect, selectedKey }: {
  mocks: Mocks;
  onSelect: (key: string) => void;
  selectedKey: string | null;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, margin: '8px 0' }}>Моки</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {Object.keys(mocks).length === 0 && <li style={{ color: '#888' }}>Нет моков</li>}
        {Object.entries(mocks).map(([key, value]) => (
          <li key={key}>
            <button
              style={{
                background: selectedKey === key ? '#e3e7ef' : 'transparent',
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                color: '#222',
                borderRadius: 4,
              }}
              onClick={() => onSelect(key)}
            >
              {key}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
