import React from 'react';

// Playground для props (controls)
export function ControlsPanel({ args, argTypes, onChange }: {
  args: Record<string, any>,
  argTypes: Record<string, { type: string }>,
  onChange: (name: string, value: any) => void
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, margin: '8px 0' }}>Props playground</h3>
      {Object.entries(argTypes).map(([name, { type }]) => (
        <div key={name} style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>{name}:</label>
          {type === 'string' && (
            <input type="text" value={args[name] ?? ''} onChange={e => onChange(name, e.target.value)} />
          )}
          {type === 'boolean' && (
            <input type="checkbox" checked={!!args[name]} onChange={e => onChange(name, e.target.checked)} />
          )}
          {/* Можно добавить другие типы */}
        </div>
      ))}
    </div>
  );
}
