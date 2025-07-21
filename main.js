const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
  Menu,
} = require("electron");
const path = require("path");
const fs = require("fs").promises; // Use promises for better async handling
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let mainWindow;

// Move environment detection outside createWindow
const isDev = (() => {
  // Most reliable check first
  if (app.isPackaged === false) return true;

  // Environment variable checks
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.ELECTRON_IS_DEV === "1") return true;

  // Default to production
  return false;
})();

// Initialize electron-reload only once, at startup, and only in development
if (isDev) {
  try {
    require("electron-reload")(__dirname, {
      electron: path.join(__dirname, "..", "node_modules", ".bin", "electron"),
      hardResetMethod: "exit",
    });
  } catch (error) {
    console.log("electron-reload not available in production build");
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");

    // Handle dev server restarts more gracefully
    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        // If dev server is restarting, wait a bit and try again
        if (validatedURL === "http://localhost:5173/") {
          setTimeout(() => {
            mainWindow.reload();
          }, 1000);
        }
      }
    );

    // Open DevTools in development
    // mainWindow.webContents.openDevTools();
  } else {
    const buildPath = path.join(__dirname, "renderer/dist/index.html");
    mainWindow.loadFile(buildPath);
  }
}

app.whenReady().then(() => {
  createWindow();

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open Folder...",
          accelerator: "CommandOrControl+O",
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send("menu-open-folder");
            }
          },
        },
        {
          label: "Close Folder",
          accelerator: "CommandOrControl+K CommandOrControl+F",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send("menu-close-folder");
            }
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// File system operations
ipcMain.handle("read-directory", async (event, dirPath) => {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    return items.map((item) => ({
      name: item.name,
      type: item.isDirectory() ? "folder" : "file",
      path: path.join(dirPath, item.name),
    }));
  } catch (error) {
    console.error("Error reading directory:", error);
    throw error;
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});

// Robust save handler following best practices
ipcMain.handle(
  "save-file",
  async (event, { content, filePath = null, showDialog = true }) => {
    try {
      let targetPath = filePath;

      // Show dialog only if no path provided or explicitly requested
      if (!targetPath || showDialog) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        const result = await dialog.showSaveDialog(focusedWindow, {
          title: "Save File",
          defaultPath: targetPath ? path.basename(targetPath) : "untitled.txt",
          filters: [
            { name: "TypeScript", extensions: ["ts", "tsx"] },
            { name: "JavaScript", extensions: ["js", "jsx"] },
            { name: "JSON", extensions: ["json"] },
            { name: "Markdown", extensions: ["md"] },
            { name: "CSS", extensions: ["css"] },
            { name: "HTML", extensions: ["html"] },
            { name: "Python", extensions: ["py"] },
            { name: "Text", extensions: ["txt"] },
            { name: "All Files", extensions: ["*"] },
          ],
        });

        if (result.canceled) {
          return { success: false, canceled: true };
        }
        targetPath = result.filePath;
      }

      // Resolve to absolute path for file operations
      const absolutePath = path.resolve(targetPath);

      // Write file using async fs
      await fs.writeFile(absolutePath, content, "utf-8");

      // Return relative path to maintain frontend consistency
      const relativePath = path.relative(process.cwd(), absolutePath);

      return {
        success: true,
        filePath: relativePath,
        message: "File saved successfully",
      };
    } catch (error) {
      console.error(`❌ Save failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

ipcMain.handle("get-root-path", async () => {
  return process.cwd();
});

ipcMain.handle("load-prefs", async () => {
  // TODO: Implement preferences loading
  return {};
});

ipcMain.handle("open-folder-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Select Folder to Open",
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]; // Return the selected folder path
  }

  return null;
});

ipcMain.handle("open-multiple-folders-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory", "multiSelections"],
    title: "Select Folders to Add to Workspace",
  });

  if (!result.canceled) {
    return result.filePaths; // Return array of selected folder paths
  }

  return [];
});

ipcMain.handle("save-workspace", async (event, workspaceConfig) => {
  const userDataPath = app.getPath("userData");
  const workspacePath = path.join(userDataPath, "workspace.json");

  try {
    await fs.writeFile(workspacePath, JSON.stringify(workspaceConfig, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-workspace", async () => {
  const userDataPath = app.getPath("userData");
  const workspacePath = path.join(userDataPath, "workspace.json");

  try {
    const data = await fs.readFile(workspacePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return null; // No saved workspace
  }
});

ipcMain.handle("close-window", async () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

// Chat functionality with Gemini AI
ipcMain.handle("send-chat-message", async (event, message) => {
  try {
    const prompt = `You are a helpful AI assistant for a code editor. Help the user with their coding questions and provide clear, concise answers.

🎨 BEAUTIFUL FORMATTING INSTRUCTIONS:
- Use emojis to make responses more engaging and friendly
- Use **bold text** for important concepts, keywords, and emphasis
- Use *italic text* for subtle emphasis and definitions
- Use \`inline code\` for technical terms, function names, and short code snippets
- When providing code examples, always use proper markdown code blocks with language specification
- Format code blocks like this: \`\`\`javascript\n// your code here\n\`\`\`
- Use appropriate language tags for code blocks (javascript, typescript, python, html, css, etc.)
- Add visual separators like "---" between sections
- Use bullet points with emojis for lists: • 🚀 • ⚡ • 💡
- Highlight important warnings with ⚠️ and tips with 💡
- Use 🎯 for main points, 🔧 for technical details, 📝 for notes
- Keep explanations clear, concise, and visually appealing
- If the entire response is code, format it as a single code block
- If mixing text and code, separate them clearly with line breaks

📱 RESPONSIVE DESIGN INSTRUCTIONS:
- Keep text lines reasonably short (max 80-100 characters) for better readability on smaller screens
- Break long explanations into shorter paragraphs
- Use bullet points and lists to improve scanning on mobile devices
- When writing long URLs or file paths, consider breaking them into multiple lines
- For very long code examples, consider splitting them into smaller, focused snippets
- Use clear section headers to improve navigation on smaller screens

Example format:
🎯 **Main Point**: Here's what you need to know
💡 **Tip**: This is a helpful tip
🔧 **Technical Detail**: Here's the technical explanation
\`inline code\` and **bold important terms**

\`\`\`javascript
// Your code example
\`\`\`

User message: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to get AI response");
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
