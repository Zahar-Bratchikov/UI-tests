import React, { useRef } from 'react';

export function ScreenshotPanel({ onScreenshot }: { onScreenshot: () => void }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        style={{
          background: '#2d72d9',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '8px 16px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
        onClick={onScreenshot}
      >
        Сделать скриншот
      </button>
    </div>
  );
}
