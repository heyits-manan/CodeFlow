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
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

// Keep original Gemini AI for fallback using new SDK
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Test the API key with a simple call

(async () => {
  try {
    await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ text: "Hello" }],
    });
  } catch (error) {
    console.error("❌ Gemini API connection failed:", error.message);
  }
})();

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

// Debug environment detection

// Disabled electron-reload for clean VS Code-like experience
// If you need auto-reload functionality in the future, you can:
// 1. Install electron-reload: npm install electron-reload
// 2. Uncomment and configure the code below with specific file patterns

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

    // More intelligent dev server restart handling
    let reloadAttempts = 0;
    const maxReloadAttempts = 3;

    // Add a more robust approach to prevent unnecessary reloads
    let lastReloadTime = 0;
    const minReloadInterval = 5000; // Minimum 5 seconds between reloads

    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        const now = Date.now();

        // Only reload for actual dev server failures, not temporary network issues
        if (
          validatedURL === "http://localhost:5173/" &&
          errorCode === -6 && // ERR_CONNECTION_REFUSED
          reloadAttempts < maxReloadAttempts &&
          now - lastReloadTime > minReloadInterval // Prevent rapid reloads
        ) {
          reloadAttempts++;
          lastReloadTime = now;

          // Wait longer before reloading to avoid interrupting file saves
          setTimeout(() => {
            // Double-check that we still need to reload
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.reload();
            }
          }, 2000);
        }
      }
    );

    // Reset reload attempts counter on successful load
    mainWindow.webContents.on("did-finish-load", () => {
      reloadAttempts = 0;
    });

    // Additional debugging for network events
    mainWindow.webContents.on("did-navigate", (event, url) => {});

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

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ text: prompt }],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });
    const response = result.candidates[0].content.parts[0].text;
    return response;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to get AI response");
  }
});

// AI-powered inline code completion
ipcMain.on(
  "get-code-completion",
  async (event, { textBeforeCursor, textAfterCursor, language, requestId }) => {
    try {
      // Better prompt for code completion
      const prompt = `You are an expert ${language} code completion assistant. 

Complete the following code. Provide ONLY the code that should be inserted at the cursor position. 
Do NOT include any explanations, comments about what you're doing, or markdown formatting.
Do NOT repeat the existing code.
Focus on providing meaningful, contextually appropriate completions.

Existing code before cursor:
\`\`\`${language}
${textBeforeCursor}
\`\`\`

Code after cursor (for context):
\`\`\`${language}
${textAfterCursor}
\`\`\`

Complete the code at the cursor position:`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp", // Use the experimental model for better code completion
        contents: [{ text: prompt }],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.1, // Lower temperature for more focused completions
          topP: 0.9,
          topK: 40,
        },
      });

      let completion = result.candidates[0].content.parts[0].text.trim();

      // Clean up the completion
      completion = completion.replace(/^``````$/, "");
      completion = completion.replace(/^```\w*$/, "");
      completion = completion.replace(/^```$/, "");

      // Send the result back to the renderer with the same request ID
      event.sender.send("code-completion-response", { completion, requestId });
    } catch (error) {
      console.error("❌ Error fetching Gemini completion:", error);
      event.sender.send("code-completion-response", {
        completion: null,
        requestId,
      });
    }
  }
);

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
