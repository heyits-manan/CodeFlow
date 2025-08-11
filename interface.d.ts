export interface IElectronAPI {
  loadPreferences: () => Promise<void>;
  readFile: (filePath: string) => Promise<string>;
  saveFile: (options: {
    content: string;
    filePath?: string | null;
    showDialog?: boolean;
  }) => Promise<{
    success: boolean;
    filePath?: string;
    message?: string;
    error?: string;
    canceled?: boolean;
  }>;
  readDir: (dirPath: string) => Promise<any[]>;
  getRootPath: () => Promise<string>;
  openFolderDialog: () => Promise<string | null>;
  openMultipleFoldersDialog: () => Promise<string[]>;
  saveWorkspace: (
    workspaceConfig: any
  ) => Promise<{ success: boolean; error?: string }>;
  loadWorkspace: () => Promise<any>;
  sendChatMessage: (message: string) => Promise<string>;
  sendCodeCompletionRequest: (params: {
    textBeforeCursor: string;
    textAfterCursor: string;
    language: string;
    requestId: string;
  }) => void;
  onCodeCompletionResponse: (
    callback: (
      event: any,
      data: { completion: string | null; requestId: string }
    ) => void
  ) => void;

  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileItem[];
}

export interface WorkspaceFolder {
  name: string;
  path: string;
  files: FileItem[];
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }

  namespace JSX {
    interface Element {}
  }
}
