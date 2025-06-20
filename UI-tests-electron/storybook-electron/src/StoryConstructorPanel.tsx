import React, { useState } from 'react';
import { getAllStories, getComponentProps } from './storiesLoader';

// StoryConstructorPanel: визуальный редактор stories
const StoryConstructorPanel: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<string>('');
  const [variantName, setVariantName] = useState<string>('CustomVariant');
  const [propsState, setPropsState] = useState<Record<string, any>>({});
  const [codePreview, setCodePreview] = useState<string>('');

  const stories: Array<{ name: string }> = getAllStories();

  const handleStoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStory(e.target.value);
    setPropsState({});
  };

  const handlePropChange = (key: string, value: any) => {
    setPropsState(prev => ({ ...prev, [key]: value }));
  };

  const handleVariantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVariantName(e.target.value);
  };

  const handleGenerateCode = () => {
    if (!selectedStory) return;
    const propsString = Object.entries(propsState)
      .map(([k, v]) => `${k}={${JSON.stringify(v)}}`)
      .join(' ');
    const code = `export const ${variantName} = () => <${selectedStory} ${propsString} />;`;
    setCodePreview(code);
  };

  const handleOpenInWindow = () => {
    // Открыть новое окно Electron с передачей выбранной story и props
    // Для этого потребуется ipcRenderer.invoke('open-story-window', { story: selectedStory, props: propsState })
    // Реализация в main process Electron
    window.electronAPI?.openStoryWindow?.({ story: selectedStory, props: propsState });
  };

  const handleSaveStory = () => {
    if (!selectedStory || !variantName || !codePreview) return;
    // Отправить код на main process для сохранения
    window.electronAPI?.saveStoryFile?.({
      story: selectedStory,
      variant: variantName,
      code: codePreview,
    });
  };

  // Получить список props для выбранной story
  const propsList = selectedStory ? getComponentProps(selectedStory) : [];

  return (
    <div style={{ padding: 16 }}>
      <h2>Story Constructor</h2>
      <div>
        <label>Компонент:&nbsp;
          <select value={selectedStory} onChange={handleStoryChange}>
            <option value="">-- выберите --</option>
            {stories.map((story: any) => (
              <option key={story.name} value={story.name}>{story.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>Variant name:&nbsp;
          <input value={variantName} onChange={handleVariantNameChange} />
        </label>
      </div>
      <div>
        <h4>Props</h4>
        {propsList.length === 0 && <div>Выберите компонент</div>}
        {propsList.map((prop: string) => (
          <div key={prop}>
            <label>{prop}:&nbsp;
              <input
                value={propsState[prop] ?? ''}
                onChange={e => handlePropChange(prop, e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>
      <button onClick={handleGenerateCode}>Сгенерировать код story</button>
      <button onClick={handleSaveStory} disabled={!codePreview}>Сохранить story</button>
      <button onClick={handleOpenInWindow} disabled={!selectedStory}>Открыть в новом окне</button>
      <div>
        <h4>Сгенерированный код:</h4>
        <pre>{codePreview}</pre>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    electronAPI?: {
      openStoryWindow?: (data: any) => void;
      saveStoryFile?: (data: { story: string; variant: string; code: string }) => void;
    };
  }
}

export default StoryConstructorPanel;
