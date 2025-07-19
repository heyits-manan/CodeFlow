# CodeFlow IDE

A modern, AI-powered code editor built with Electron and React, inspired by VS Code and Cursor. CodeFlow combines a sleek interface with intelligent features to enhance your coding experience.

Editor Features
- **Multi-file tabs** with intelligent tab management
- **Monaco Editor** integration with syntax highlighting for 20+ languages
- **File explorer** with search and folder navigation
- **Keyboard shortcuts** for power users (CMD+S, CMD+W, CMD+Shift+I)
- **Auto-save** functionality with visual indicators

### 🤖 AI-Powered Features
- **AI Chat Integration** powered by Google Gemini
- **Context-aware conversations** about your code
- **Resizable chat panel** (CMD+Shift+I to toggle)
- **Smart code assistance** and explanations

### 🎨 Modern Interface
- **Dark theme** optimized for long coding sessions
- **Glassmorphism design** with backdrop blur effects
- **Responsive layout** with resizable panels
- **Touch-friendly** interface elements
- **File type icons** for better visual organization

### ⚡ Performance Optimizations
- **React memoization** for efficient re-renders
- **Virtual scrolling** for large file trees
- **Debounced search** with real-time filtering
- **Lazy loading** of folder contents

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/codeflow-ide.git
   cd codeflow-ide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   echo "NODE_ENV=development
   ELECTRON_IS_DEV=1
   GEMINI_API_KEY=your_gemini_api_key_here" > .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Getting Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add it to your `.env` file

### Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build React app
- `npm run build:electron` - Build for current platform
- `npm run build:win` - Build Windows executable
- `npm run build:mac` - Build macOS DMG
- `npm run build:linux` - Build Linux AppImage

### Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| Electron | Desktop app framework | Latest |
| React | UI framework | 18.x |
| TypeScript | Type safety | 5.x |
| Vite | Build tool & dev server | Latest |
| Monaco Editor | Code editor | Latest |
| Tailwind CSS | Styling | 3.x |
| Shadcn | Component Library | Latest |
| Google Gemini | AI integration | Latest |

## 📦 Building for Distribution

### Create Executables

```bash
# Build for your current platform
npm run build:electron

# Build for specific platforms
npm run build:win     # Windows .exe
npm run build:mac     # macOS .dmg  
npm run build:linux   # Linux .AppImage
```

### Output Files
- **Windows**: `dist-electron/CodeFlow Setup 1.0.0.exe`
- **macOS**: `dist-electron/CodeFlow-1.0.0.dmg`
- **Linux**: `dist-electron/CodeFlow-1.0.0.AppImage`

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save file |
| `Cmd/Ctrl + Shift + S` | Save as |
| `Cmd/Ctrl + W` | Close tab |
| `Cmd/Ctrl + Shift + I` | Toggle AI chat |
| `Cmd/Ctrl + O` | Open folder |

## 🐛 Known Issues

- [ ] Search highlighting in large files may cause performance issues
- [ ] Folder refresh needed after external file system changes
- [ ] Chat history not persisted between sessions

## 🗺️ Roadmap

### Planned Features
- [ ] **Git integration** with status indicators
- [ ] **Terminal integration** within the editor
- [ ] **Theme customization** system
- [ ] **Plugin architecture** for extensions
- [ ] **Collaborative editing** with real-time sync
- [ ] **Advanced AI features** (code generation, refactoring)
- [ ] **Multi-language support** for UI
- [ ] **Workspace persistence** and session restore

### Version 2.0
- [ ] **LSP integration** for advanced IntelliSense
- [ ] **Debugging support** with breakpoints
- [ ] **Docker integration** for containerized development
- [ ] **Cloud sync** for settings and preferences

## 🐞 Bug Reports

Found a bug? Please create an issue with:
- **Environment details** (OS, Node.js version, etc.)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Console logs** if relevant

## 🙏 Acknowledgments

- **Microsoft Monaco Editor** for the excellent code editing experience
- **Google Gemini** for AI integration capabilities
- **Electron community** for the robust desktop framework
- **VS Code team** for design inspiration
- **Cursor team** for AI-powered editing concepts

**⭐ Star this repository if you find it helpful!**

