import { useCallback } from 'react';

interface UseFileOperationsProps {
  showNotification: (message: string, duration?: number) => void;
  setOpenFiles: React.Dispatch<React.SetStateAction<any[]>>; // Replace 'any' with actual OpenFile type if available
  setActiveFile: React.Dispatch<React.SetStateAction<string | null>>;
  editorInstances: React.MutableRefObject<Map<string, any>>;
  activeFile: string | null;
  openFiles: any[]; // Replace 'any' with actual OpenFile type if available
  getFileName: (filePath: string) => string;
}

export const useFileOperations = ({
  showNotification,
  setOpenFiles,
  setActiveFile,
  editorInstances,
  activeFile,
  openFiles,
  getFileName,
}: UseFileOperationsProps) => {

  const handleSave = useCallback(
    async (filePath: string) => {
      if (!filePath) return;

      const editorInstance = editorInstances.current.get(filePath);
      if (!editorInstance) return;

      const content = editorInstance.getValue();

      try {
        showNotification("Saving...");

        const result = await window.electronAPI.saveFile({
          content,
          filePath: filePath,
          showDialog: false,
        });

        if (result.success) {
          setOpenFiles((prev) =>
            prev.map((file) =>
              file.path === filePath
                ? { ...file, originalContent: content, isModified: false }
                : file
            )
          );
          showNotification(result.message || "File saved successfully", 2000);
        } else if (!result.canceled) {
          showNotification(`Save failed: ${result.error}`, 4000);
        }
      } catch (error) {
        console.error("Save error:", error);
        showNotification("Failed to save file");
      }
    },
    [showNotification, setOpenFiles, editorInstances] // Dependencies for handleSave
  );

  const handleSaveAs = useCallback(
    async (filePath: string) => {
      if (!filePath) return;

      const editorInstance = editorInstances.current.get(filePath);
      if (!editorInstance) return;

      const content = editorInstance.getValue();

      try {
        showNotification("Choose save location...");

        const result = await window.electronAPI.saveFile({
          content,
          filePath: filePath,
          showDialog: true,
        });

        if (result.success && result.filePath) {
          const newFilePath = result.filePath; // Capture the new file path

          setOpenFiles((prev) =>
            prev.map((file) =>
              file.path === filePath
                ? {
                    path: newFilePath,
                    content: content,
                    originalContent: content,
                    isModified: false,
                  }
                : file
            )
          );

          if (activeFile === filePath) {
            setActiveFile(newFilePath);
          }

          showNotification(result.message || "File saved as new file", 2000);
        } else if (result.canceled) {
          setSaveStatus(""); // This needs to be passed as a prop or handled differently
        } else {
          showNotification(`Save As failed: ${result.error}`, 4000);
        }
      } catch (error) {
        console.error("Save As error:", error);
        showNotification("Failed to save file");
      }
    },
    [showNotification, setOpenFiles, setActiveFile, editorInstances, activeFile] // Dependencies for handleSaveAs
  );

  const handleTabClose = useCallback(
    (filePath: string) => {
      const file = openFiles.find((f) => f.path === filePath);

      // Show confirmation for modified files (like VS Code)
      if (file?.isModified) {
        const shouldClose = window.confirm(
          `${getFileName(
            filePath
          )} has unsaved changes. Do you want to close it anyway?`
        );
        if (!shouldClose) {
          return;
        }
      }

      // Clean up editor instance
      editorInstances.current.delete(filePath);

      // Update files and active file in one go
      setOpenFiles((prev) => {
        const newFiles = prev.filter((f) => f.path !== filePath);

        // If we're closing the active file, switch to another one
        if (filePath === activeFile) {
          if (newFiles.length > 0) {
            // Find the index of the closed file and switch to the next logical file
            const closedIndex = prev.findIndex((f) => f.path === filePath);
            const nextFile = newFiles[Math.min(closedIndex, newFiles.length - 1)];
            setActiveFile(nextFile.path);
          } else {
            setActiveFile(null);
          }
        }

        return newFiles;
      });
    },
    [openFiles, activeFile, setOpenFiles, setActiveFile, editorInstances, getFileName, showNotification] // Dependencies for handleTabClose
  );

  return {
    handleSave,
    handleSaveAs,
    handleTabClose,
  };
};