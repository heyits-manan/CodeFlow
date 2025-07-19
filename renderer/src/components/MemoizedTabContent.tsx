import { memo } from 'react';
import { TabsContent } from './ui/tabs';
import CodeEditor from './CodeEditor';
import * as monaco from 'monaco-editor';

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  isModified: boolean;
}

interface MemoizedTabContentProps {
  filePath: string;
  content: string;
  isModified: boolean;
  getFileName: (filePath: string) => string;
  onContentChange: (filePath: string, value: string) => void;
  onEditorMount: (filePath: string, editor: monaco.editor.IStandaloneCodeEditor) => void;
  onSave: (filePath: string) => void;
  onSaveAs: (filePath: string) => void;
}

const MemoizedTabContent = memo(
  ({ filePath, content, isModified, getFileName, onContentChange, onEditorMount, onSave, onSaveAs }: MemoizedTabContentProps) => {
    return (
      <div
        key={filePath}
        className="flex-1 mt-0 p-4 h-full overflow-hidden"
      >
        <CodeEditor
          fileContent={content}
          fileName={getFileName(filePath)}
          filePath={filePath}
          isModified={isModified}
          onChange={onContentChange}
          onEditorMount={onEditorMount}
          onSave={onSave}
          onSaveAs={onSaveAs}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // This custom comparison function is the key.
    // It tells React to only re-render if the props that affect the visual output have changed.
    return (
      prevProps.isModified === nextProps.isModified &&
      prevProps.content === nextProps.content &&
      prevProps.filePath === nextProps.filePath
    );
  }
);

export default MemoizedTabContent;
