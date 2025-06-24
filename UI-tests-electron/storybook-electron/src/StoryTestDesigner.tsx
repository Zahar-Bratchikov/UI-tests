import React, { useState } from 'react';

interface Step {
  type: 'action' | 'screenshot';
  selector?: string;
  action?: string;
  value?: string;
}

const actions = [
  { label: 'Клик', value: 'click' },
  { label: 'Ввести текст', value: 'type' },
  { label: 'Ожидание', value: 'wait' },
];

const StoryTestDesigner: React.FC = () => {
  const [appPath, setAppPath] = useState('');
  const [storyName, setStoryName] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [selector, setSelector] = useState('');
  const [action, setAction] = useState('click');
  const [value, setValue] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Открыть диалог выбора файла
  const openFileDialog = async () => {
    if (window.electronAPI?.getAppPath) {
      const path = await window.electronAPI.getAppPath();
      if (path) setAppPath(path);
    } else {
      alert('Диалог выбора файла не поддерживается. Обновите preload.js и main process.');
    }
  };

  // Добавить шаг
  const addStep = (type: Step['type']) => {
    if (type === 'action') {
      setSteps([...steps, { type: 'action', action, selector, value }]);
    } else {
      setSteps([...steps, { type: 'screenshot', selector }]);
    }
    setSelector('');
    setValue('');
  };

  // Удалить шаг
  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  // Drag & drop reorder
  const onDragStart = (idx: number) => setDraggedIdx(idx);
  const onDragOver = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newSteps = [...steps];
    const [dragged] = newSteps.splice(draggedIdx, 1);
    newSteps.splice(idx, 0, dragged);
    setSteps(newSteps);
    setDraggedIdx(idx);
  };
  const onDragEnd = () => setDraggedIdx(null);

  // Сохранить историю (заглушка)
  const saveStory = () => {
    alert('История сохранена!');
  };

  // Запустить тест (заглушка)
  const runTest = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f4f6fa', fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#23272f', color: '#fff', padding: '32px 20px', boxShadow: '2px 0 12px #0001' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32, letterSpacing: 1 }}>Test Stories</h2>
        <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
          <input
            style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: '#181b20', color: '#fff', fontSize: 15 }}
            placeholder="Путь к приложению"
            value={appPath}
            onChange={e => setAppPath(e.target.value)}
            readOnly
          />
          <button
            style={{ background: '#2d72d9', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            onClick={openFileDialog}
            title="Выбрать файл приложения"
          >
            ...
          </button>
        </div>
        <div style={{ marginBottom: 24 }}>
          <input
            style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: '#181b20', color: '#fff', fontSize: 15 }}
            placeholder="Название истории"
            value={storyName}
            onChange={e => setStoryName(e.target.value)}
          />
        </div>
        <button
          onClick={saveStory}
          style={{ width: '100%', background: '#2d72d9', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontWeight: 600, fontSize: 16, marginBottom: 12, cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}
        >
          💾 Сохранить историю
        </button>
        <button
          onClick={runTest}
          style={{ width: '100%', background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontWeight: 600, fontSize: 16, cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.7 : 1, boxShadow: '0 2px 8px #0002' }}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Выполняется...' : '▶️ Запустить тест'}
        </button>
      </aside>

      {/* Main area */}
      <main style={{ flex: 1, padding: '48px 40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px #0001', padding: 36 }}>
          <h1 style={{ textAlign: 'center', marginBottom: 32, fontWeight: 800, fontSize: 28, letterSpacing: 1, color: '#23272f' }}>
            Конструктор тестовых историй
          </h1>
          <section style={{ marginBottom: 36 }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Добавить шаг</h3>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={action} onChange={e => setAction(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #d0d4db', fontSize: 15, background: '#f7f8fa' }}>
                {actions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <input
                style={{ width: 180, padding: 8, borderRadius: 6, border: '1px solid #d0d4db', fontSize: 15 }}
                placeholder="CSS селектор"
                value={selector}
                onChange={e => setSelector(e.target.value)}
              />
              {action === 'type' && (
                <input
                  style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #d0d4db', fontSize: 15 }}
                  placeholder="Текст"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              )}
              <button
                style={{ background: '#2d72d9', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 15, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                onClick={() => addStep('action')}
              >
                + Действие
              </button>
              <button
                style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 15, boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
                onClick={() => addStep('screenshot')}
              >
                📸 Скриншот
              </button>
            </div>
          </section>

          <section>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Шаги истории</h3>
            {steps.length === 0 && <div style={{ color: '#aaa', fontSize: 15, marginBottom: 16 }}>Нет шагов</div>}
            <ol style={{ paddingLeft: 0, listStyle: 'none' }}>
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => { e.preventDefault(); onDragOver(idx); }}
                  onDragEnd={onDragEnd}
                  style={{
                    marginBottom: 12,
                    background: draggedIdx === idx ? '#e3f2fd' : '#f7f8fa',
                    borderRadius: 8,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: '0 1px 4px #0001',
                    border: '1px solid #e0e3e8',
                    cursor: 'grab',
                    opacity: draggedIdx === idx ? 0.7 : 1,
                  }}
                >
                  <span style={{ fontWeight: 700, color: step.type === 'action' ? '#2d72d9' : '#4caf50', minWidth: 90 }}>
                    {step.type === 'action' ? 'Действие' : 'Скриншот'}
                  </span>
                  {step.type === 'action' && (
                    <span style={{ color: '#555', fontSize: 15 }}>
                      {actions.find(a => a.value === step.action)?.label} {step.selector && `по ${step.selector}`} {step.value && `: "${step.value}"`}
                    </span>
                  )}
                  {step.type === 'screenshot' && (
                    <span style={{ color: '#555', fontSize: 15 }}>
                      по {step.selector || 'всей странице'}
                    </span>
                  )}
                  <button
                    onClick={() => removeStep(idx)}
                    style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: 20, marginLeft: 'auto' }}
                    title="Удалить шаг"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div style={{ textAlign: 'center', color: '#888', fontSize: 15, marginTop: 32 }}>
          <p>Создайте историю, добавьте шаги, делайте скриншоты и запускайте автотесты для CI/CD.</p>
        </div>
      </main>
    </div>
  );
};

// Глобальный тип electronAPI объявлен в electron-api.d.ts

export default StoryTestDesigner;
