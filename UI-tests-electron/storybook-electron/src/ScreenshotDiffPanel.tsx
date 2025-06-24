import React from 'react';

export function ScreenshotDiffPanel({
  baseline,
  current,
}: {
  baseline: string | null;
  current: string | null;
}) {
  const [diffUrl, setDiffUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!baseline || !current || !window.electronAPI?.compareScreenshots) return setDiffUrl(null);
    let cancelled = false;
    window.electronAPI.compareScreenshots({ baseline, current }).then((url: string | null) => {
      if (!cancelled) setDiffUrl(url);
    });
    return () => { cancelled = true; };
  }, [baseline, current]);
  if (!baseline || !current) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <h4>Сравнение скриншотов:</h4>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Базовый</div>
          <img src={baseline} alt="baseline" style={{ maxWidth: 200, border: '1px solid #ccc' }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Текущий</div>
          <img src={current} alt="current" style={{ maxWidth: 200, border: '1px solid #ccc' }} />
        </div>
        {diffUrl && (
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Diff</div>
            <img src={diffUrl} alt="diff" style={{ maxWidth: 200, border: '1px solid #f00' }} />
          </div>
        )}
      </div>
    </div>
  );
}
