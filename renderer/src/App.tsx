import React, { useState, useEffect, useRef, useCallback } from "react";
import { Separator } from "./components/ui/separator";
import { FileExplorer } from "./components/FileExplorer";
import MemoizedTabContent from "./components/MemoizedTabContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { X } from "lucide-react";
import { useFileOperations } from "./hooks/use-file-operations";
import { ChatBar } from "./components/ChatBar";
import type { WorkspaceFolder } from "../../interface";

interface OpenFile {
  path: string;
  content: string;
  originalContent: string; // Track original content for modified indicator
  isModified: boolean; // Track if file has been modified (like VS Code's * indicator)
}

export default function App() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileExplorerWidth, setFileExplorerWidth] = useState(300);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceFolder | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatBarWidth, setChatBarWidth] = useState(350);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const minFileExplorerWidth = 200;
  const maxFileExplorerWidth = 600;

  console.log("Hello")

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = e.clientX;
    if (newWidth > minFileExplorerWidth && newWidth < maxFileExplorerWidth) {
      setFileExplorerWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Chat resize handlers
  const handleChatResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizingChat) return;
      const newWidth = window.innerWidth - e.clientX;
      setChatBarWidth(Math.max(250, Math.min(600, newWidth)));
    },
    [isResizingChat]
  );

  const handleChatMouseDown = useCallback(() => {
    setIsResizingChat(true);
  }, []);

  useEffect(() => {
    if (isResizingChat) {
      document.addEventListener("mousemove", handleChatResize);
      document.addEventListener("mouseup", () => setIsResizingChat(false));
      return () => {
        document.removeEventListener("mousemove", handleChatResize);
        document.removeEventListener("mouseup", () => setIsResizingChat(false));
      };
    }
  }, [isResizingChat, handleChatResize]);

  // Store Monaco editor instances to get current content
  const editorInstances = useRef<Map<string, any>>(new Map());

  // Simple notification system
  const showNotification = (message: string, duration: number = 3000) => {
    // Removed setSaveStatus(message) and setTimeout(() => setSaveStatus(""), duration);
  };

  const getFileName = (filePath: string) => {
    return filePath.split(/[\\/]/).pop() || "";
  };

  const { handleSave, handleSaveAs, handleTabClose } = useFileOperations({
    showNotification,
    setOpenFiles,
    setActiveFile,
    editorInstances,
    activeFile,
    openFiles,
    getFileName,
  });

  // Function to insert code into the current active file
  const handleInsertCode = useCallback(
    (code: string, fileName?: string) => {
      if (!activeFile) {
        showNotification("No active file to insert code into", 3000);
        return;
      }

      const editorInstance = editorInstances.current.get(activeFile);
      if (!editorInstance) {
        showNotification("Editor not ready", 3000);
        return;
      }

      try {
        const currentContent = editorInstance.getValue();
        const cursorPosition = editorInstance.getPosition();

        // Insert code at cursor position
        editorInstance.executeEdits("insert-code", [
          {
            range: {
              startLineNumber: cursorPosition.lineNumber,
              startColumn: cursorPosition.column,
              endLineNumber: cursorPosition.lineNumber,
              endColumn: cursorPosition.column,
            },
            text: code,
          },
        ]);

        // Mark file as modified
        setOpenFiles((prev) =>
          prev.map((file) =>
            file.path === activeFile ? { ...file, isModified: true } : file
          )
        );

        showNotification(`Code inserted into ${getFileName(activeFile)}`, 2000);
      } catch (error) {
        console.error("Failed to insert code:", error);
        showNotification("Failed to insert code", 3000);
      }
    },
    [activeFile, editorInstances, setOpenFiles, getFileName, showNotification]
  );

  // Function to create a new file with the provided code
  const handleCreateFile = useCallback(
    async (code: string, fileName: string) => {
      try {
        // Generate a unique file path
        const timestamp = Date.now();
        const fileExtension = fileName.includes(".") ? "" : ".js";
        const newFileName = fileName.includes(".")
          ? fileName
          : `${fileName}${fileExtension}`;
        const newFilePath = `new-file-${timestamp}-${newFileName}`;

        // Add the new file to open files
        const newFile: OpenFile = {
          path: newFilePath,
          content: code,
          originalContent: code,
          isModified: false,
        };

        setOpenFiles((prev) => [...prev, newFile]);
        setActiveFile(newFilePath);

        showNotification(`Created new file: ${newFileName}`, 2000);
      } catch (error) {
        console.error("Failed to create new file:", error);
        showNotification("Failed to create new file", 3000);
      }
    },
    [setOpenFiles, setActiveFile, showNotification]
  );

  const handleFileSelect = async (filePath: string) => {
    // Check if file is already open
    if (openFiles.some((f) => f.path === filePath)) {
      setActiveFile(filePath);
      return;
    }

    try {
      // Read file content using electron API
      const content = await window.electronAPI.readFile(filePath);
      const newFile: OpenFile = {
        path: filePath,
        content,
        originalContent: content,
        isModified: false,
      };
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFile(filePath);
    } catch (error) {
      console.error("Error opening file:", error);
      showNotification("Failed to open file");
    }
  };

  // Handle content change from Monaco editor (like VS Code)
  const handleFileChange = useCallback(
    (filePath: string, newContent: string) => {
      setOpenFiles((prev) =>
        prev.map((f) => {
          if (f.path === filePath) {
            return {
              ...f,
              content: newContent,
              isModified: newContent !== f.originalContent, // Track if modified like VS Code
            };
          }
          return f;
        })
      );
    },
    []
  );

  // Store Monaco editor instance reference
  const handleEditorMount = useCallback((filePath: string, editor: any) => {
    editorInstances.current.set(filePath, editor);
  }, []);

  // Keyboard shortcuts (like VS Code) - Ctrl+S and Ctrl+Shift+S
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!activeFile) return;

      // CMD+W / Ctrl+W - Close current tab
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "w" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleTabClose(activeFile);
        return;
      }

      // Ctrl+S / Cmd+S - Save (like VS Code)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleSave(activeFile);
      }

      // Ctrl+Shift+S / Cmd+Shift+S - Save As (like VS Code)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s" &&
        e.shiftKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleSaveAs(activeFile);
      }

      // CMD+SHIFT+I / Ctrl+Shift+I - Toggle Chat Bar
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "i"
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsChatOpen(!isChatOpen);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [activeFile, handleSave, handleSaveAs, handleTabClose, isChatOpen]); // Add handleTabClose to dependencies

  const handleOpenFolder = useCallback(async () => {
    try {
      const folderPath = await window.electronAPI.openFolderDialog();
      if (folderPath) {
        // Close all current files when switching workspace
        setOpenFiles([]);
        setActiveFile(null);

        // Load new workspace
        const folderName = folderPath.split(/[\\/]/).pop() || "New Folder";
        const fileList = await window.electronAPI.readDir(folderPath);

        // Sort items (folders first, then files alphabetically)
        const sortItems = (items: any[]) => {
          return [...items].sort((a, b) => {
            if (a.type === "folder" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "folder") return 1;
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          });
        };

        setCurrentWorkspace({
          name: folderName,
          path: folderPath,
          files: sortItems(fileList),
        });
      }
    } catch (error) {
      console.error("Error opening folder:", error);
    }
  }, []);

  const handleCloseWorkspace = useCallback(() => {
    setCurrentWorkspace(null);
    setOpenFiles([]);
    setActiveFile(null);
  }, []);

  const handleWorkspaceUpdate = useCallback(
    (updatedWorkspace: WorkspaceFolder) => {
      setCurrentWorkspace(updatedWorkspace);
    },
    []
  );

  // Restore state from localStorage on initial load
  useEffect(() => {
    const loadState = async () => {
      const savedStateJSON = localStorage.getItem("editor-session");
      let savedOpenFiles: OpenFile[] = [];
      let savedActiveFile: string | null = null;

      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (
          savedState.openFilePaths &&
          Array.isArray(savedState.openFilePaths)
        ) {
          for (const filePath of savedState.openFilePaths) {
            try {
              const content = await window.electronAPI.readFile(filePath);
              savedOpenFiles.push({
                path: filePath,
                content,
                originalContent: content,
                isModified: false,
              });
            } catch (error) {
              console.error(`Failed to restore file ${filePath}:`, error);
            }
          }
          savedActiveFile = savedState.activeFile;
        }
      }
      setOpenFiles(savedOpenFiles);
      if (
        savedActiveFile &&
        savedOpenFiles.some((f) => f.path === savedActiveFile)
      ) {
        setActiveFile(savedActiveFile);
      } else if (savedOpenFiles.length > 0) {
        setActiveFile(savedOpenFiles[0].path);
      }

      // Load workspace
      const savedWorkspace = await window.electronAPI.loadWorkspace();
      if (savedWorkspace && savedWorkspace.length > 0) {
        // Take the first workspace (single workspace pattern)
        setCurrentWorkspace(savedWorkspace[0]);
      }
    };

    loadState();
  }, []); // Empty dependency array ensures this runs only once

  // Persist state to localStorage and workspace to file
  useEffect(() => {
    // Do not save state if there are no open files
    if (openFiles.length === 0 && activeFile === null) {
      localStorage.removeItem("editor-session");
    } else {
      const stateToSave = {
        openFilePaths: openFiles.map((f) => f.path),
        activeFile: activeFile,
      };
      localStorage.setItem("editor-session", JSON.stringify(stateToSave));
    }

    // Save workspace
    if (currentWorkspace) {
      window.electronAPI.saveWorkspace([currentWorkspace]);
    }
  }, [openFiles, activeFile, currentWorkspace]);

  // Handle tab closing from main process
  useEffect(() => {
    const handleCloseTab = () => {
      if (activeFile) {
        handleTabClose(activeFile);
      }
    };

    const handleOpenFolderFromMenu = async () => {
      await handleOpenFolder();
    };

    const handleCloseWorkspaceFromMenu = () => {
      handleCloseWorkspace();
    };

    // Listen for the close-current-tab event from main process
    window.electronAPI?.on("close-current-tab", handleCloseTab);
    window.electronAPI?.on("menu-open-folder", handleOpenFolderFromMenu);
    window.electronAPI?.on("menu-close-folder", handleCloseWorkspaceFromMenu);

    return () => {
      window.electronAPI?.removeAllListeners("close-current-tab");
      window.electronAPI?.removeAllListeners("menu-open-folder");
      window.electronAPI?.removeAllListeners("menu-close-folder");
    };
  }, [activeFile, handleTabClose, handleOpenFolder, handleCloseWorkspace]);

  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      <FileExplorer
        key={currentWorkspace?.path || "no-workspace"}
        onFileSelect={handleFileSelect}
        selectedFiles={openFiles.map((f) => f.path)}
        width={fileExplorerWidth}
        currentWorkspace={currentWorkspace}
        onOpenFolder={handleOpenFolder}
        onCloseWorkspace={handleCloseWorkspace}
        onWorkspaceUpdate={handleWorkspaceUpdate}
      />
      <div
        className="w-1 bg-neutral-700 cursor-col-resize hover:bg-neutral-600 transition-colors"
        onMouseDown={handleMouseDown}
      />
      <Separator
        orientation="vertical"
        className="h-full w-2 cursor-ew-resize bg-slate-700/50 hover:bg-slate-600/70 transition-colors duration-200"
        onMouseDown={handleMouseDown}
      />
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Editor and Chat Layout */}
        <div className="flex-1 flex h-full">
          {/* Editor Content */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Save Status Bar */}
            {/* Removed saveStatus && (...) */}
            {openFiles.length > 0 ? (
              <Tabs
                value={activeFile || ""}
                onValueChange={setActiveFile}
                className="flex-1 flex flex-col h-full"
              >
                <TabsList className="w-full justify-start rounded-none bg-background p-0 h-10">
                  {openFiles
                    .filter((file) => file.path)
                    .map((file) => (
                      <TabsTrigger
                        key={file.path}
                        value={file.path}
                        className="relative rounded-none border-r px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-blue-500 after:scale-x-0 data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200"
                      >
                        <span className="mr-2 flex items-center">
                          {/* Modified indicator (like VS Code's * for unsaved files) */}
                          {file.isModified && (
                            <span className="text-orange-500 mr-1">●</span>
                          )}
                          {getFileName(file.path)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTabClose(file.path);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TabsTrigger>
                    ))}
                </TabsList>

                {openFiles
                  .filter((file) => file.path)
                  .map((file) => (
                    <TabsContent
                      key={file.path}
                      value={file.path}
                      className="flex-1 h-full m-0 p-0"
                    >
                      <MemoizedTabContent
                        filePath={file.path}
                        content={file.content}
                        isModified={file.isModified}
                        onContentChange={handleFileChange}
                        onEditorMount={handleEditorMount}
                        getFileName={getFileName}
                        onSave={handleSave}
                        onSaveAs={handleSaveAs}
                      />
                    </TabsContent>
                  ))}
              </Tabs>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">Select a file to edit</p>
                  <p className="text-sm text-muted-foreground">
                    Use Ctrl+S to save, Ctrl+Shift+S to save as
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Resizer */}
          {isChatOpen && (
            <div
              className="w-1 bg-neutral-700 cursor-col-resize hover:bg-neutral-600 transition-colors"
              onMouseDown={handleChatMouseDown}
            />
          )}

          {/* Chat Bar */}
          <ChatBar
            isOpen={isChatOpen}
            onToggle={() => setIsChatOpen(!isChatOpen)}
            width={chatBarWidth}
            onWidthChange={setChatBarWidth}
            onInsertCode={handleInsertCode}
            onCreateFile={handleCreateFile}
          />
        </div>
      </main>
    </div>
  );
}
