// Автоматический loader для stories
// Импортирует все *.stories.tsx из src/stories

declare const require: any;

function importAll(r: any) {
  return r.keys().map(r);
}

export const stories = importAll(require.context('./stories', true, /\.stories\.tsx$/));
export default stories;

// Получить список всех stories (названия компонентов)
export function getAllStories() {
  // stories: массив модулей, каждый с default.title и экспортами
  return stories.flatMap((story: any) => {
    const meta = story.default || {};
    return Object.entries(story)
      .filter(([key]) => key !== 'default')
      .map(([key]) => ({ name: key, title: meta.title || key }));
  });
}

// Получить список props для компонента (заглушка, можно доработать через propTypes/argTypes)
export function getComponentProps(storyName: string): string[] {
  // Поиск по stories
  for (const story of stories) {
    const meta = story.default || {};
    for (const [key, comp] of Object.entries(story)) {
      if (key !== 'default' && key === storyName) {
        // Попытка получить argTypes
        if (meta.component && meta.component.argTypes) {
          return Object.keys(meta.component.argTypes);
        }
        // Пример для Button
        if (meta.title === 'UI/Button') {
          return ['label'];
        }
      }
    }
  }
  return [];
}
