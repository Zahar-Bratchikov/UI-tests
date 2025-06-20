import React from 'react';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export function ScreenshotDiffPanel({
  baseline,
  current,
}: {
  baseline: string | null;
  current: string | null;
}) {
  const [diffUrl, setDiffUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!baseline || !current) return;
    let cancelled = false;
    (async () => {
      // Декодируем base64 PNG
      function decode(dataUrl: string) {
        const bin = atob(dataUrl.split(',')[1]);
        // Преобразуем Uint8Array в Node.js Buffer для PNG.sync.read
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        // @ts-ignore
        return PNG.sync.read(Buffer.from(arr));
      }
      try {
        const img1 = decode(baseline);
        const img2 = decode(current);
        const { width, height } = img1;
        const diff = new PNG({ width, height });
        pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
        const diffBuffer = PNG.sync.write(diff);
        if (!cancelled) setDiffUrl('data:image/png;base64,' + btoa(String.fromCharCode(...diffBuffer)));
      } catch (e) {
        if (!cancelled) setDiffUrl(null);
      }
    })();
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
