import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { stories } from './storiesLoader';
import { ControlsPanel } from './ControlsPanel';
import { MocksPanel } from './MocksPanel';
import { ScreenshotPanel } from './ScreenshotPanel';
import { ScreenshotDiffPanel } from './ScreenshotDiffPanel';
import html2canvas from 'html2canvas';
import StoryConstructorPanel from './StoryConstructorPanel';

// Собираем все stories и их экспорты
const storyList = stories.map((story: any, idx: number) => {
  const meta = story.default || {};
  const storyExports = Object.entries(story)
    .filter(([key]) => key !== 'default')
    .map(([key, comp]) => ({
      name: key,
      component: comp,
      title: meta.title || `Story ${idx + 1}`,
      meta,
    }));
  return { meta, storyExports };
});

function getArgTypes(meta: any) {
  // Пример: можно расширить для автогенерации типов
  if (meta && meta.component && meta.component.argTypes) return meta.component.argTypes;
  // Для Button — label: string
  if (meta.title === 'UI/Button') {
    return { label: { type: 'string' } };
  }
  return {};
}

const defaultMocks: Record<string, Record<string, any>> = {
  'UI/Button:Default': {
    default: { label: 'Default' },
    test: { label: 'Тестовый мок' },
  },
  'UI/Button:WithAction': {
    default: { label: 'Click me' },
  },
};

// Для хранения baseline скриншотов (в реальном проекте — хранить на диске или в БД)
const baselineScreenshots: Record<string, string> = {};

const App = () => {
  const [selected, setSelected] = useState<{title: string, name: string} | null>(null);
  const [args, setArgs] = useState<Record<string, any>>({});
  const [selectedMock, setSelectedMock] = useState<string>('default');

  // Скриншотер
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);

  let SelectedComponent: React.FC | null = null;
  let argTypes: Record<string, { type: string }> = {};
  let storyMeta: any = null;

  if (selected) {
    for (const { storyExports, meta } of storyList) {
      for (const s of storyExports) {
        if (s.title === selected.title && s.name === selected.name) {
          SelectedComponent = s.component;
          argTypes = getArgTypes(meta);
          storyMeta = meta;
        }
      }
    }
  }

  // Получаем моки для выбранной story
  const storyKey = selected ? `${selected.title}:${selected.name}` : '';
  const mocks = (storyKey && defaultMocks[storyKey]) ? defaultMocks[storyKey] : {};

  // Моки для stories (редактируемые)
  const [customMocks, setCustomMocks] = useState<Record<string, Record<string, any>>>({});

  // Controls: обновление props
  const handleChange = (name: string, value: any) => {
    setArgs(prev => ({ ...prev, [name]: value }));
  };

  // При выборе моков — обновлять args
  const handleSelectMock = (key: string) => {
    setSelectedMock(key);
    setArgs(mocks[key] || {});
  };

  // Редактор моков
  const handleEditMock = (key: string, value: any) => {
    setCustomMocks(prev => ({
      ...prev,
      [storyKey]: {
        ...(prev[storyKey] || {}),
        [key]: value,
      },
    }));
    setArgs(value);
  };

  const handleScreenshot = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current);
      setScreenshot(canvas.toDataURL('image/png'));
    }
  };

  // При выборе новой story/mocks — подгружать baseline
  React.useEffect(() => {
    if (storyKey && baselineScreenshots[storyKey]) {
      setBaseline(baselineScreenshots[storyKey]);
    } else {
      setBaseline(null);
    }
  }, [storyKey, selectedMock]);

  // Сохранить текущий скриншот как baseline
  const handleSaveBaseline = () => {
    if (screenshot && storyKey) {
      baselineScreenshots[storyKey] = screenshot;
      setBaseline(screenshot);
    }
  };

  // Экспорт baseline-скриншотов
  const handleExportBaselines = () => {
    const data = JSON.stringify(baselineScreenshots, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'baselines.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Импорт baseline-скриншотов
  const handleImportBaselines = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        Object.assign(baselineScreenshots, data);
        setBaseline(null); // сбросить, чтобы обновить
      } catch {}
    };
    reader.readAsText(file);
  };

  // Парсинг query params для открытия story в отдельном окне (если есть)
  function getQueryParams() {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const story = params.get('story');
    const props = params.get('props');
    return {
      story,
      props: props ? JSON.parse(props) : undefined,
    };
  }

  const query = getQueryParams();

  // Если story и props переданы через query, автоматически выбрать их
  React.useEffect(() => {
    if (query.story) {
      // Найти story по имени и выбрать
      for (const { meta, storyExports } of storyList) {
        for (const s of storyExports) {
          if (s.name === query.story || s.title === query.story) {
            setSelected({ title: s.title, name: s.name });
            setArgs(query.props || {});
            setSelectedMock('default');
            return;
          }
        }
      }
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ width: 280, borderRight: '1px solid #eee', padding: 16, background: '#fafbfc' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 16px 0' }}>Stories</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {storyList.map(({ meta, storyExports }: any, idx: number) => (
            <li key={idx} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>{meta.title}</div>
              <ul style={{ listStyle: 'none', paddingLeft: 12 }}>
                {storyExports.map((s: any, i: number) => (
                  <li key={i}>
                    <button
                      style={{
                        background: selected && selected.title === s.title && selected.name === s.name ? '#e3e7ef' : 'transparent',
                        border: 'none',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        color: '#222',
                        borderRadius: 4,
                      }}
                      onClick={() => {
                        setSelected({ title: s.title, name: s.name });
                        setArgs({});
                        setSelectedMock('default');
                      }}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ marginBottom: 32 }}>
          <StoryConstructorPanel />
        </div>
        {SelectedComponent ? (
          <>
            <MocksPanel mocks={{ ...mocks, ...customMocks[storyKey] }} onSelect={handleSelectMock} selectedKey={selectedMock} />
            <div style={{ margin: '8px 0' }}>
              <input type="text" placeholder="Имя мока" value={selectedMock} onChange={e => setSelectedMock(e.target.value)} />
              <button onClick={() => handleEditMock(selectedMock, args)}>Сохранить мок</button>
            </div>
            <ControlsPanel args={args} argTypes={argTypes} onChange={handleChange} />
            <ScreenshotPanel onScreenshot={handleScreenshot} />
            <div ref={previewRef} style={{ border: '1px solid #eee', padding: 24, borderRadius: 8, background: '#fff', minHeight: 80 }}>
              <SelectedComponent {...args} />
            </div>
            {screenshot && (
              <div style={{ marginTop: 24 }}>
                <h4>Скриншот:</h4>
                <img src={screenshot} alt="screenshot" style={{ maxWidth: 400, border: '1px solid #ccc' }} />
                <div style={{ marginTop: 8 }}>
                  <button
                    style={{
                      background: '#2d72d9',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={handleSaveBaseline}
                  >
                    Сохранить как baseline
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <button onClick={handleExportBaselines}>Экспорт baseline</button>
              <input type="file" accept="application/json" onChange={handleImportBaselines} />
            </div>
            <ScreenshotDiffPanel baseline={baseline} current={screenshot} />
          </>
        ) : (
          <div style={{ color: '#888' }}>Выберите story слева</div>
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
