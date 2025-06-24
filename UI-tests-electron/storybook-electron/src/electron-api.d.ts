declare global {
  interface Window {
    electronAPI?: {
      openStoryWindow?: (data: any) => void;
      saveStoryFile?: (data: { story: string; variant: string; code: string }) => void;
      compareScreenshots?: (data: { baseline: string; current: string }) => Promise<string | null>;
      getAppPath?: () => Promise<string>;
      setAppPath?: (path: string) => Promise<boolean>;
      openFileDialog?: () => Promise<string | null>;
    };
  }
}
export {};
