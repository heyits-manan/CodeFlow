import React, { useRef, useState, useEffect, memo } from "react";
import { Editor } from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Button } from "./ui/button";
import { Save, FileText } from "lucide-react";

interface CodeEditorProps {
  fileContent: string;
  fileName: string;
  filePath: string;
  isModified?: boolean;
  onChange: (filePath: string, value: string) => void;
  onEditorMount: (
    filePath: string,
    editor: monaco.editor.IStandaloneCodeEditor
  ) => void;
  onSave: (filePath: string) => void;
  onSaveAs: (filePath: string) => void;
}

// Helper to map file extension to Monaco language
const extensionToLanguage: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  php: "php",
  json: "json",
  html: "html",
  css: "css",
  md: "markdown",
  sh: "shell",
  go: "go",
  rs: "rust",
  swift: "swift",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
  txt: "plaintext",
};

function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (ext && extensionToLanguage[ext]) || "plaintext";
}

const CodeEditor = ({
  fileContent,
  fileName,
  filePath,
  isModified = false,
  onChange,
  onEditorMount,
  onSave,
  onSaveAs,
}: CodeEditorProps) => {
  // Inject React types for Monaco to support JSX/TSX
  useEffect(() => {
    if ((window as any).__monaco_react_types_injected) return;
    (window as any).__monaco_react_types_injected = true;
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ES2015,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      checkJs: false,
      allowSyntheticDefaultImports: true,
    });

    // Configure JavaScript defaults for JSX support
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ES2015,
      noEmit: true,
      allowJs: true,
      checkJs: false,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowSyntheticDefaultImports: true,
    });

    // Add React type definitions
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `import * as React from 'react';
      declare global {
        namespace JSX {
          interface IntrinsicElements {
            [elemName: string]: any;
          }
          interface Element extends React.ReactElement { }
          interface ElementClass extends React.Component {
            render(): React.ReactNode;
          }
          interface ElementAttributesProperty { props: {}; }
          interface ElementChildrenAttribute { children: {}; }
        }
      }`,
      "file:///node_modules/@types/react/index.d.ts"
    );
  }, []);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [value, setValue] = useState<string>("");
  const [language, setLanguage] = useState<string>("plaintext");

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
    onEditorMount(filePath, editor);
  };

  // Update editor value when fileContent changes
  useEffect(() => {
    setValue(fileContent);
  }, [fileContent]);

  // Auto-detect language when fileName changes
  useEffect(() => {
    setLanguage(detectLanguage(fileName));
  }, [fileName]);

  // Force editor layout when filePath changes (e.g., tab switch)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [filePath]);

  return (
    <div className="flex flex-col h-full">
      {/* File Header with Save Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700/60 bg-neutral-800/50">
        <div className="flex items-center gap-2">
          {isModified && <div className="w-2 h-2 bg-orange-400 rounded-full" />}
          <FileText className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-200">
            {fileName}
          </span>
          <span className="text-xs text-neutral-500 px-2 py-0.5 bg-neutral-700 rounded">
            {language}
          </span>
        </div>

        {/* Save buttons */}
        <div className="flex gap-1">
          <Button
            onClick={() => onSave(filePath)}
            className="h-7 px-2 text-xs hover:bg-accent"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button
            onClick={() => onSaveAs(filePath)}
            className="h-7 px-2 text-xs hover:bg-accent"
            title="Save As (Ctrl+Shift+S)"
          >
            <Save className="w-3 h-3 mr-1" />
            Save As
          </Button>
        </div>
      </div>

      {/* Monaco Editor Container - This is the key fix */}
      <div className="flex-1 min-h-0">
        {React.createElement(Editor as any, {
          height: "100%", // This ensures it fills the container
          value: value,
          language: language,
          theme: "vs-dark",
          onMount: onMount,
          options: {
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            padding: { top: 16, bottom: 16 },
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          },
          onChange: (newValue: string | undefined) => {
            const val = newValue || "";
            setValue(val);
            onChange(filePath, val);
          },
        })}
      </div>
    </div>
  );
};

export default memo(CodeEditor);
