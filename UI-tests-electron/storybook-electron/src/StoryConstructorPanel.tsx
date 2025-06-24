import React, { useState, useEffect } from 'react';
import { getAllStories, getComponentProps } from './storiesLoader';

const StoryConstructorPanel: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<string>('');
  const [variantName, setVariantName] = useState<string>('CustomVariant');
  const [propsState, setPropsState] = useState<Record<string, any>>({});
  const [codePreview, setCodePreview] = useState<string>('');
  const [appPath, setAppPath] = useState<string>('');

  useEffect(() => {
    window.electronAPI?.getAppPath?.().then((path: string) => setAppPath(path));
  }, []);

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
    window.electronAPI?.openStoryWindow?.({ story: selectedStory, props: propsState });
  };

  const handleSaveStory = () => {
    if (!selectedStory || !variantName || !codePreview) return;
    window.electronAPI?.saveStoryFile?.({
      story: selectedStory,
      variant: variantName,
      code: codePreview,
    });
  };

  const handleAppPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppPath(e.target.value);
    window.electronAPI?.setAppPath?.(e.target.value);
  };

  const propsList = selectedStory ? getComponentProps(selectedStory) : [];

  return (
    <div style={{ padding: 16 }}>
      <h2>Story Constructor</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Путь к тестируемому Electron-приложению:&nbsp;
          <input type="text" value={appPath} onChange={handleAppPathChange} style={{ width: 320 }} />
        </label>
      </div>
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

export default StoryConstructorPanel;
