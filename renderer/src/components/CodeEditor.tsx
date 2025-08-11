import type { OnMount } from "@monaco-editor/react";
import { Editor } from "@monaco-editor/react";
import { FileText, Save, Sparkles } from "lucide-react";
import * as monaco from "monaco-editor";
import React, { memo, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

/**
 * CodeEditor Component with Monaco Editor
 *
 * ✅ Red Lines Eliminated: Diagnostics are disabled at the language service level
 * ✅ JSX Support: .jsx files use "javascriptreact", .tsx files use "typescript"
 * ✅ AI Completion: Integrated with Gemini AI for inline code suggestions
 * ✅ File Operations: Save, Save As, and real-time content tracking
 */

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
// ✅ JSX files use "javascriptreact" for proper JSX support
// ✅ TSX files use "typescript" for TypeScript + JSX support
const extensionToLanguage: Record<string, string> = {
  js: "javascript",
  jsx: "javascriptreact", // ✅ Fixed: Use javascriptreact for JSX support
  ts: "typescript",
  tsx: "typescript", // ✅ Correct: TypeScript with JSX
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
  const detectedLanguage = ext && extensionToLanguage[ext];

  // Log language detection for debugging
  console.log(
    `🔍 Language detection: ${fileName} -> ${detectedLanguage || "plaintext"}`
  );

  return detectedLanguage || "plaintext";
}

// Debounce function to reduce API calls
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
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

    // Enhanced TypeScript configuration for better JSX/TSX support
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX, // ✅ Use ReactJSX for modern JSX
      reactNamespace: "React",
      allowJs: true,
      checkJs: false,
      strict: false, // ✅ Disable strict mode to reduce red lines
      noImplicitAny: false, // ✅ Allow implicit any
      noImplicitReturns: false, // ✅ Allow implicit returns
      noImplicitThis: false, // ✅ Allow implicit this
      noUnusedLocals: false, // ✅ Allow unused locals
      noUnusedParameters: false, // ✅ Allow unused parameters
      skipLibCheck: true, // ✅ Skip library checking to reduce errors
    });

    // ✅ Disable TypeScript diagnostics completely - removes all red lines
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });

    // Enhanced JavaScript configuration for JSX support
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      allowJs: true,
      checkJs: false,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX, // ✅ Use ReactJSX for modern JSX
      reactNamespace: "React",
      allowSyntheticDefaultImports: true,
      strict: false, // ✅ Disable strict mode
      noImplicitAny: false,
      noImplicitReturns: false,
      noImplicitThis: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      skipLibCheck: true,
    });

    // ✅ Disable JavaScript diagnostics completely - removes all red lines
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });

    // Enhanced React type definitions for better JSX support
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
        
        // Common React types
        declare module 'react' {
          export = React;
          export as namespace React;
        }
        
        // Allow any import/export
        declare module '*' {
          const content: any;
          export = content;
          export default content;
        }
      }`,
      "file:///node_modules/@types/react/index.d.ts"
    );

    // Also add to JavaScript defaults for JSX files
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
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
        
        // Common React types
        declare module 'react' {
          export = React;
          export as namespace React;
        }
        
        // Allow any import/export
        declare module '*' {
          const content: any;
          export = content;
          export default content;
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

    // Add keyboard shortcut for inline completion
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger("keyboard", "editor.action.inlineSuggest.trigger", {});
    });

    // Set up single global response handler with promise map
    const completionPromises = new Map();

    const handleCompletionResponse = (
      event: any,
      {
        completion,
        requestId,
      }: { completion: string | null; requestId: string }
    ) => {
      console.log("📥 Received completion response for ID:", requestId);

      const promiseData = completionPromises.get(requestId);
      if (promiseData) {
        completionPromises.delete(requestId);
        const { resolve, position } = promiseData;

        if (completion) {
          console.log("✅ Resolving with completion:", completion);
          resolve({
            items: [
              {
                insertText: completion,
                range: new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
                ),
              },
            ],
          });
        } else {
          console.log("❌ No completion received");
          resolve({ items: [] });
        }
      } else {
        console.log("❌ No promise found for request ID:", requestId);
      }
    };

    // Register single response handler
    window.electronAPI.onCodeCompletionResponse(handleCompletionResponse);

    // Create debounced completion request function
    const debouncedCompletionRequest = debounce((params: any) => {
      window.electronAPI.sendCodeCompletionRequest(params);
    }, 300); // 300ms delay

    // Register AI inline completion provider
    const provider = monaco.languages.registerInlineCompletionsProvider(
      language,
      {
        provideInlineCompletions: async (model, position, context, token) => {
          console.log(
            "🤖 AI Inline completion triggered for language:",
            language
          );
          console.log("📝 Position:", position);
          console.log("📄 Context:", context);

          try {
            // Get code context before and after cursor
            const textBeforeCursor = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });

            const textAfterCursor = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: model.getLineCount(),
              endColumn: model.getLineContent(model.getLineCount()).length + 1,
            });

            console.log("📋 Text before cursor:", textBeforeCursor.slice(-50));
            console.log("📋 Text after cursor:", textAfterCursor.slice(0, 50));

            const requestId = `completion-${Date.now()}-${Math.random()}`;
            console.log("🆔 Generated request ID:", requestId);

            return new Promise((resolve) => {
              // Store resolve function with position info
              completionPromises.set(requestId, { resolve, position });

              // Send request using debounced function
              debouncedCompletionRequest({
                textBeforeCursor,
                textAfterCursor,
                language: language,
                requestId: requestId,
              });

              // Handle cancellation
              token.onCancellationRequested(() => {
                console.log("🚫 Completion cancelled for ID:", requestId);
                completionPromises.delete(requestId);
                resolve({ items: [] });
              });

              // Timeout after 5 seconds
              setTimeout(() => {
                if (completionPromises.has(requestId)) {
                  console.log("⏰ Completion timeout for ID:", requestId);
                  completionPromises.delete(requestId);
                  resolve({ items: [] });
                }
              }, 5000);
            });
          } catch (error) {
            console.error("AI inline completion error:", error);
            return { items: [] };
          }
        },
        freeInlineCompletions: (completions) => {
          console.log("🧹 Freeing inline completions");
        },
      }
    );

    // Cleanup provider on unmount
    return () => {
      console.log("🗑️ Disposing inline completion provider");
      provider.dispose();
      completionPromises.clear();
    };
  };

  // Note: Diagnostics are now disabled at the language service level
  // This eliminates the need for manual marker clearing

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
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.trigger(
                  "keyboard",
                  "editor.action.inlineSuggest.trigger",
                  {}
                );
              }
            }}
            className="h-7 px-2 text-xs hover:bg-green-600 bg-green-600/20 text-green-300"
            title="Trigger AI Completion"
          >
            🤖 Complete
          </Button>
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
            inlineSuggest: { enabled: true }, // Enable inline suggestions
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
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
            // ✅ Better editor experience
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
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
