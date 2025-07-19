import {
  Archive,
  Braces,
  ChevronDown,
  ChevronRight,
  Database,
  File,
  FileCode2,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe,
  Loader2,
  Music,
  Palette,
  Search,
  Settings,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { FileItem, WorkspaceFolder } from "../../../interface";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Enhanced modern styling with glassmorphism and better color scheme
const styles = {
  background: "bg-slate-950/95 backdrop-blur-sm",
  border: "border-slate-800/50",
  input: "bg-slate-900/60 border-slate-700/50",
  inputFocus:
    "focus:bg-slate-900/80 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20",
  text: "text-slate-200",
  textMuted: "text-slate-400",
  icon: "text-slate-500",
  folderIcon: "text-blue-400",
  folderOpenIcon: "text-blue-300",
  selected: "bg-blue-500/15 border-l-2 border-blue-400 text-blue-100",
  hover: "hover:bg-slate-800/40 transition-all duration-200",
  highlight: "bg-yellow-400/20 text-yellow-300 px-1 rounded",
  searchContainer: "bg-slate-900/50 border-b border-slate-800/50",
  loadingShimmer:
    "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse",
};

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFiles: string[];
  width: number;
  currentWorkspace: WorkspaceFolder | null;
  onOpenFolder: () => void;
  onCloseWorkspace: () => void;
  onWorkspaceUpdate?: (updatedWorkspace: WorkspaceFolder) => void;
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const iconProps = "w-4 h-4";

  switch (extension) {
    case "json":
      return <FileJson className={iconProps} />;
    case "js":
    case "jsx":
      return <FileCode2 className={iconProps} />;
    case "ts":
    case "tsx":
      return <FileCode2 className={iconProps} />;
    case "html":
    case "htm":
      return <Globe className={iconProps} />;
    case "css":
    case "scss":
    case "sass":
      return <Palette className={iconProps} />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return <FileImage className={iconProps} />;
    case "svg":
      return <FileImage className={iconProps} />;
    case "mp4":
    case "avi":
    case "mov":
    case "webm":
      return <FileVideo className={iconProps} />;
    case "mp3":
    case "wav":
    case "ogg":
    case "flac":
      return <Music className={iconProps} />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
      return <Archive className={iconProps} />;
    case "md":
    case "mdx":
      return <FileText className={iconProps} />;
    case "xml":
    case "yml":
    case "yaml":
      return <Braces className={iconProps} />;
    case "sql":
      return <Database className={iconProps} />;
    case "xlsx":
    case "xls":
    case "csv":
      return <FileSpreadsheet className={iconProps} />;
    case "env":
    case "config":
      return <Settings className={iconProps} />;
    default:
      return <FileText className={iconProps} />;
  }
};

const Highlight = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className={styles.highlight}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export function FileExplorer({
  onFileSelect,
  selectedFiles,
  width,
  currentWorkspace,
  onOpenFolder,
  onCloseWorkspace,
  onWorkspaceUpdate,
}: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  // Clear expanded folders and search query when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      // Clear all states when workspace changes
      setExpandedFolders(new Set());
      setSearchQuery("");
      setLoadingFolders(new Set());
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [currentWorkspace?.path]);

  const sortItems = useCallback((items: FileItem[]): FileItem[] => {
    return [...items].sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }, []);

  const performDeepSearch = useMemo(() => {
    const ignoredNames = new Set([
      "node_modules",
      ".git",
      ".DS_Store",
      "dist",
      "build",
      ".next",
      ".nuxt",
      "coverage",
      ".nyc_output",
    ]);

    const ignoredExtensions = new Set([
      ".log",
      ".lock",
      ".env.local",
      ".cache",
    ]);

    return async function search(
      query: string,
      basePath: string = "."
    ): Promise<FileItem[]> {
      const results: FileItem[] = [];
      let items: FileItem[] = [];

      try {
        items = await window.electronAPI.readDir(basePath);
      } catch (e) {
        return [];
      }

      for (const item of items) {
        if (
          ignoredNames.has(item.name) ||
          (item.name.startsWith(".") && item.type === "folder") ||
          (item.type === "file" &&
            item.name.includes(".") &&
            ignoredExtensions.has(item.name.slice(item.name.lastIndexOf("."))))
        ) {
          continue;
        }

        if (item.type === "folder") {
          const children = await search(query, item.path);
          if (children.length > 0) {
            results.push({ ...item, children });
          }
        } else if (item.type === "file") {
          if (item.name.toLowerCase().includes(query.toLowerCase())) {
            results.push(item);
          }
        }
      }

      return results;
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setExpandedFolders(new Set());
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const results = await performDeepSearch(searchQuery.trim());
        setSearchResults(sortItems(results));

        // Auto-expand folders in search results
        const folderPaths = new Set<string>();
        const collectFolderPaths = (items: FileItem[]) => {
          for (const item of items) {
            if (item.type === "folder") {
              folderPaths.add(item.path);
              if (item.children) {
                collectFolderPaths(item.children);
              }
            }
          }
        };
        collectFolderPaths(results);
        setExpandedFolders(folderPaths);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, performDeepSearch, sortItems]);

  const toggleFolder = useCallback(
    async (path: string, workspaceRootPath: string) => {
      const isExpanded = expandedFolders.has(path);

      if (isExpanded) {
        // Collapse folder
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
        return;
      }

      // Expand folder
      if (currentWorkspace) {
        const findItem = (items: FileItem[], p: string): FileItem | null => {
          for (const item of items) {
            if (item.path === p) return item;
            if (item.children) {
              const found = findItem(item.children, p);
              if (found) return found;
            }
          }
          return null;
        };

        // Find the item in the current workspace
        const folderItem = findItem(currentWorkspace.files, path);

        if (folderItem?.type === "folder") {
          // Add to loading state
          setLoadingFolders((prev) => new Set(prev).add(path));

          try {
            let children: FileItem[];

            if (folderItem.children === undefined) {
              // Load children from disk
              children = await window.electronAPI.readDir(path);

              // Update the workspace with new children
              const updateChildren = (
                items: FileItem[],
                p: string,
                newChildren: FileItem[]
              ): FileItem[] => {
                return items.map((item) => {
                  if (item.path === p)
                    return { ...item, children: newChildren };
                  if (item.children) {
                    return {
                      ...item,
                      children: updateChildren(item.children, p, newChildren),
                    };
                  }
                  return item;
                });
              };

              const updatedFiles = updateChildren(
                currentWorkspace.files,
                path,
                sortItems(children)
              );

              // Update the workspace
              const updatedWorkspace = {
                ...currentWorkspace,
                files: updatedFiles,
              };

              // Pass the updated workspace back to the parent
              onWorkspaceUpdate?.(updatedWorkspace);
            } else {
              // Children already loaded, use existing
              children = folderItem.children;
            }

            // Now expand the folder
            setExpandedFolders((prev) => {
              const next = new Set(prev);
              next.add(path);
              return next;
            });
          } catch (error) {
            console.error(`Error loading folder: ${path}`, error);
          } finally {
            // Remove from loading state
            setLoadingFolders((prev) => {
              const next = new Set(prev);
              next.delete(path);
              return next;
            });
          }
        }
      }
    },
    [expandedFolders, currentWorkspace, sortItems, onWorkspaceUpdate]
  );

  const handleFileSelection = useCallback(
    (filePath: string) => {
      onFileSelect(filePath);
      setSearchQuery("");
    },
    [onFileSelect]
  );

  const renderFileTree = useCallback(
    (
      items: FileItem[],
      level = 0,
      workspaceRootPath: string
    ): React.ReactElement[] => {
      return items.map((item) => {
        const isSelected = selectedFiles.includes(item.path);
        const isExpanded = expandedFolders.has(item.path);
        const isLoading = loadingFolders.has(item.path);

        return (
          <div key={item.path}>
            <div
              className={`flex items-center gap-2 p-2 cursor-pointer rounded-md transition-colors ${
                styles.hover
              } ${isSelected ? styles.selected : styles.text}`}
              style={{ paddingLeft: `${(level + 1) * 16}px` }}
              onClick={() =>
                item.type === "folder"
                  ? toggleFolder(item.path, workspaceRootPath)
                  : handleFileSelection(item.path)
              }
            >
              {item.type === "folder" ? (
                <>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  {isExpanded ? (
                    <FolderOpen
                      className={`w-4 h-4 ${styles.folderOpenIcon}`}
                    />
                  ) : (
                    <Folder className={`w-4 h-4 ${styles.folderIcon}`} />
                  )}
                </>
              ) : (
                <div className="w-4 h-4 ml-4">{getFileIcon(item.name)}</div>
              )}

              <span className="text-sm truncate">
                {searchQuery.trim() ? (
                  <Highlight text={item.name} highlight={searchQuery} />
                ) : (
                  item.name
                )}
              </span>

              {/* File count badge for folders */}
              {item.type === "folder" && item.children && !isLoading && (
                <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full ml-auto">
                  {item.children.length}
                </span>
              )}
            </div>

            {item.type === "folder" &&
              isExpanded &&
              item.children &&
              !isLoading && (
                <div>
                  {renderFileTree(item.children, level + 1, workspaceRootPath)}
                </div>
              )}
          </div>
        );
      });
    },
    [
      expandedFolders,
      selectedFiles,
      searchQuery,
      toggleFolder,
      handleFileSelection,
      loadingFolders,
    ]
  );

  const renderLoadingState = () => (
    <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          <div
            className={`h-4 rounded animate-pulse flex-1 ${styles.loadingShimmer}`}
          />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = (message: string) => (
    <div className={`text-center py-8 ${styles.textMuted}`}>
      <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-2 opacity-60">Try a different search term</p>
    </div>
  );

  const renderWelcomeState = () => (
    <div className={`text-center py-8 ${styles.textMuted}`}>
      <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-sm font-medium mb-2">No Folder Opened</p>
      <p className="text-xs mb-4 opacity-60">
        Open a folder to start working on your project files.
      </p>
      <Button
        onClick={onOpenFolder}
        className="h-8 px-3 text-xs hover:bg-slate-800/40"
      >
        <FolderPlus className="w-3 h-3 mr-1" />
        Open Folder
      </Button>
    </div>
  );

  const renderWorkspaceTree = (): React.ReactElement[] => {
    if (!currentWorkspace) {
      return [renderWelcomeState()];
    }

    if (searchQuery.trim()) {
      return searchResults.length > 0
        ? renderFileTree(searchResults, 0, "")
        : [
            <div
              key="no-results"
              className={`text-center py-8 ${styles.textMuted}`}
            >
              <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No results for "{searchQuery}"</p>
              <p className="text-xs mt-2 opacity-60">
                Try a different search term
              </p>
            </div>,
          ];
    }

    return renderFileTree(currentWorkspace.files, 0, currentWorkspace.path);
  };

  const renderContent = () => {
    if (isSearching) return renderLoadingState();

    const hasSearchQuery = searchQuery.trim().length > 0;
    const itemsToRender = hasSearchQuery
      ? searchResults
      : currentWorkspace?.files || [];
    const emptyMessage = hasSearchQuery
      ? `No results for "${searchQuery}"`
      : "No files in this workspace";

    if (itemsToRender.length === 0 && !hasSearchQuery && currentWorkspace) {
      return renderEmptyState(emptyMessage);
    }

    return <div className="space-y-1">{renderWorkspaceTree()}</div>;
  };

  return (
    <div
      className={`flex flex-col h-full ${styles.background} ${styles.border} border-r`}
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-200">Explorer</h2>
          {currentWorkspace && (
            <div className="flex gap-1">
              <Button
                onClick={onOpenFolder}
                className="h-6 px-2 text-xs hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                title="Open Folder"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
              <Button
                onClick={onCloseWorkspace}
                className="h-6 px-2 text-xs hover:bg-red-600/20 text-slate-400 hover:text-red-400"
                title="Close Folder"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              pl-10 pr-4 py-2 text-sm text-white
              ${styles.input}
              ${styles.inputFocus}
              placeholder:text-slate-500
            `}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-slate-500" />
          )}
        </div>
      </div>

      {/* Workspace header */}
      {currentWorkspace && (
        <div className="flex items-center justify-between p-3 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Folder className={`w-4 h-4 ${styles.folderIcon}`} />
            <span className="text-sm font-medium text-slate-300">
              {currentWorkspace.name}
            </span>
          </div>
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">{renderContent()}</div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-800/50 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>{currentWorkspace?.files.length || 0} items</span>
          {searchQuery && <span>{searchResults.length} found</span>}
        </div>
      </div>
    </div>
  );
}
