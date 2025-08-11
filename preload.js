const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Existing file operations
  readDir: (dirPath) => ipcRenderer.invoke("read-directory", dirPath),
  getRootPath: () => ipcRenderer.invoke("get-root-path"),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  saveFile: (options) => ipcRenderer.invoke("save-file", options),
  loadPreferences: () => ipcRenderer.invoke("load-prefs"),

  // Add event handling methods for Command+W functionality
  on: (channel, callback) => {
    // Whitelist allowed channels for security
    const validChannels = [
      "close-current-tab",
      "menu-open-folder",
      "menu-close-folder",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  removeAllListeners: (channel) => {
    const validChannels = [
      "close-current-tab",
      "menu-open-folder",
      "menu-close-folder",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // Optional: Add method to close window when last tab is closed
  closeWindow: () => {
    ipcRenderer.invoke("close-window");
  },

  // Add new folder dialog methods
  openFolderDialog: () => ipcRenderer.invoke("open-folder-dialog"),
  openMultipleFoldersDialog: () =>
    ipcRenderer.invoke("open-multiple-folders-dialog"),
  saveWorkspace: (workspaceConfig) =>
    ipcRenderer.invoke("save-workspace", workspaceConfig),
  loadWorkspace: () => ipcRenderer.invoke("load-workspace"),

  // Chat functionality
  sendChatMessage: (message) =>
    ipcRenderer.invoke("send-chat-message", message),

  // AI Inline Code Completion
  sendCodeCompletionRequest: (params) =>
    ipcRenderer.send("get-code-completion", params),
  onCodeCompletionResponse: (callback) =>
    ipcRenderer.on("code-completion-response", callback),
});
