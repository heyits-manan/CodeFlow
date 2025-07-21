import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  Bot,
  X,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  FileText,
  Plus,
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatBarProps {
  isOpen: boolean;
  onToggle: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  onInsertCode?: (code: string, fileName?: string) => void;
  onCreateFile?: (code: string, fileName: string) => void;
}

// Enhanced CodeBlock component with syntax highlighting and actions
const CodeBlock = ({
  code,
  language,
  fileName,
  onInsertCode,
  onCreateFile,
}: {
  code: string;
  language: string;
  fileName?: string;
  onInsertCode?: (code: string, fileName?: string) => void;
  onCreateFile?: (code: string, fileName: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-md overflow-hidden relative group">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-700/30 border-b border-slate-600/50">
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-300 font-medium">
            {fileName || language || "code"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onInsertCode && (
            <Button
              onClick={() => onInsertCode(code, fileName)}
              className="h-6 px-2 text-xs bg-blue-600/80 hover:bg-blue-600 text-white"
              title="Insert into active file"
            >
              Insert
            </Button>
          )}
          {onCreateFile && fileName && (
            <Button
              onClick={() => onCreateFile(code, fileName)}
              className="h-6 px-2 text-xs bg-green-600/80 hover:bg-green-600 text-white"
              title="Create new file"
            >
              <FileText className="h-3 w-3 mr-1" />
              New File
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0 hover:bg-slate-600/50"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Code Content with Horizontal Scroll */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "12px",
            fontSize: "12px",
            lineHeight: "1.4",
            backgroundColor: "transparent",
            whiteSpace: "pre",
            minWidth: "100%",
          }}
          showLineNumbers={code.split("\n").length > 5}
          wrapLines={false}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Language detection function
const detectLanguage = (code: string): string => {
  const firstLine = code.split("\n")[0].toLowerCase();

  if (
    firstLine.includes("function") ||
    firstLine.includes("const ") ||
    firstLine.includes("let ") ||
    firstLine.includes("var ")
  ) {
    return "javascript";
  }
  if (firstLine.includes("import ") || firstLine.includes("export ")) {
    return "typescript";
  }
  if (firstLine.includes("def ") || firstLine.includes("import ")) {
    return "python";
  }
  if (
    firstLine.includes("public class") ||
    firstLine.includes("private ") ||
    firstLine.includes("public ")
  ) {
    return "java";
  }
  if (firstLine.includes("<?php") || firstLine.includes("function ")) {
    return "php";
  }
  if (firstLine.includes("package ") || firstLine.includes("import ")) {
    return "go";
  }
  if (firstLine.includes("fn ") || firstLine.includes("let ")) {
    return "rust";
  }
  if (firstLine.includes("class ") && firstLine.includes("{")) {
    return "csharp";
  }
  if (firstLine.includes("html") || firstLine.includes("<!DOCTYPE")) {
    return "html";
  }
  if (
    firstLine.includes("css") ||
    (firstLine.includes("{") && firstLine.includes(":"))
  ) {
    return "css";
  }

  return "javascript"; // default
};

// MessageContent component to properly parse and render messages with code blocks
const MessageContent = ({
  content,
  onInsertCode,
  onCreateFile,
}: {
  content: string;
  onInsertCode?: (code: string, fileName?: string) => void;
  onCreateFile?: (code: string, fileName: string) => void;
}) => {
  // Parse markdown-style code blocks (```language\ncode\n```)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent hover:shadow-sm mb-3"
            style={{ minWidth: "fit-content", maxWidth: "none" }}
          >
            {formatTextContent(textContent)}
          </div>
        );
      }
    }

    // Add code block
    const language = match[1] || "text";
    const code = match[2].trim();
    const fileName = extractFileName(code);
    parts.push(
      <div key={`code-${match.index}`} className="mb-3">
        <CodeBlock
          code={code}
          language={language}
          fileName={fileName}
          onInsertCode={onInsertCode}
          onCreateFile={onCreateFile}
        />
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex).trim();
    if (remainingContent) {
      parts.push(
        <div
          key={`text-${lastIndex}`}
          className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent hover:shadow-sm"
          style={{ minWidth: "fit-content", maxWidth: "none" }}
        >
          {formatTextContent(remainingContent)}
        </div>
      );
    }
  }

  // If no code blocks found, check if entire content is code
  if (parts.length === 0) {
    const isEntireContentCode =
      content.includes("function") ||
      content.includes("const ") ||
      content.includes("let ") ||
      content.includes("var ") ||
      content.includes("import ") ||
      content.includes("export ") ||
      content.includes("class ") ||
      content.includes("if (") ||
      content.includes("for (") ||
      content.includes("while (") ||
      content.includes("=>") ||
      (content.includes("{") && content.includes("}")) ||
      (content.includes("(") && content.includes(")")) ||
      content.split("\n").length > 3;

    if (isEntireContentCode) {
      const language = detectLanguage(content);
      const fileName = extractFileName(content);
      return (
        <CodeBlock
          code={content}
          language={language}
          fileName={fileName}
          onInsertCode={onInsertCode}
          onCreateFile={onCreateFile}
        />
      );
    }

    // Otherwise, render as regular text
    return (
      <div
        className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent hover:shadow-sm"
        style={{ minWidth: "fit-content", maxWidth: "none" }}
      >
        {formatTextContent(content)}
      </div>
    );
  }

  return <>{parts}</>;
};

// Format text content with markdown-like formatting
const formatTextContent = (text: string): React.ReactNode => {
  // Split text into parts based on markdown patterns
  const parts: (string | JSX.Element)[] = [];
  let currentText = text;

  // Pattern for **bold text**
  const boldPattern = /\*\*(.*?)\*\*/g;
  let boldMatch;
  let lastIndex = 0;

  while ((boldMatch = boldPattern.exec(text)) !== null) {
    // Add text before bold
    if (boldMatch.index > lastIndex) {
      parts.push(text.slice(lastIndex, boldMatch.index));
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${boldMatch.index}`} className="font-bold text-white">
        {boldMatch[1]}
      </strong>
    );
    lastIndex = boldMatch.index + boldMatch[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no bold patterns found, process other patterns
  if (parts.length === 1 && typeof parts[0] === "string") {
    currentText = parts[0] as string;
    parts.length = 0;
    lastIndex = 0;

    // Pattern for *italic text*
    const italicPattern = /\*(.*?)\*/g;
    let italicMatch;

    while ((italicMatch = italicPattern.exec(currentText)) !== null) {
      // Add text before italic
      if (italicMatch.index > lastIndex) {
        parts.push(currentText.slice(lastIndex, italicMatch.index));
      }
      // Add italic text
      parts.push(
        <em
          key={`italic-${italicMatch.index}`}
          className="italic text-slate-300"
        >
          {italicMatch[1]}
        </em>
      );
      lastIndex = italicMatch.index + italicMatch[0].length;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      parts.push(currentText.slice(lastIndex));
    }

    // If no italic patterns found, process inline code
    if (parts.length === 1 && typeof parts[0] === "string") {
      currentText = parts[0] as string;
      parts.length = 0;
      lastIndex = 0;

      // Pattern for `inline code`
      const inlineCodePattern = /`([^`]+)`/g;
      let inlineCodeMatch;

      while ((inlineCodeMatch = inlineCodePattern.exec(currentText)) !== null) {
        // Add text before inline code
        if (inlineCodeMatch.index > lastIndex) {
          parts.push(currentText.slice(lastIndex, inlineCodeMatch.index));
        }
        // Add inline code
        parts.push(
          <code
            key={`inline-${inlineCodeMatch.index}`}
            className="bg-slate-700/50 px-1 py-0.5 rounded text-xs font-mono text-blue-300"
          >
            {inlineCodeMatch[1]}
          </code>
        );
        lastIndex = inlineCodeMatch.index + inlineCodeMatch[0].length;
      }

      // Add remaining text
      if (lastIndex < currentText.length) {
        parts.push(currentText.slice(lastIndex));
      }
    }
  }

  return <>{parts}</>;
};

// Extract filename from code content
const extractFileName = (code: string): string | undefined => {
  // Look for common patterns that might indicate a filename
  const lines = code.split("\n");

  // Check first few lines for comments that might contain filename
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (
      line.startsWith("//") ||
      line.startsWith("/*") ||
      line.startsWith("#")
    ) {
      const match =
        line.match(/filename[:\s]+([^\s]+)/i) ||
        line.match(/file[:\s]+([^\s]+)/i) ||
        line.match(
          /([a-zA-Z0-9_-]+\.(js|ts|jsx|tsx|py|java|cpp|c|cs|php|go|rs|html|css|json|xml|yaml|yml|md|txt))/
        );
      if (match) {
        return match[1];
      }
    }
  }

  return undefined;
};

export function ChatBar({
  isOpen,
  onToggle,
  width,
  onWidthChange,
  onInsertCode,
  onCreateFile,
}: ChatBarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        Math.max(inputRef.current.scrollHeight, 40),
        200
      )}px`;
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await window.electronAPI.sendChatMessage(input.trim());

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }

    // Auto-resize on key events too
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = `${Math.min(
          Math.max(inputRef.current.scrollHeight, 40),
          200
        )}px`;
      }
    }, 0);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flex flex-col h-full bg-slate-900 border-l border-slate-700/50 overflow-hidden min-w-0"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-200">
            AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0 hover:bg-slate-800/40"
            title={isCollapsed ? "Expand" : "Minimize"}
          >
            {isCollapsed ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0 hover:bg-slate-800/40"
            title="Close Chat"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages */}
          <ScrollArea
            className="flex-1 p-3 h-full overflow-hidden"
            style={{ minHeight: 0, flex: "1 1 auto" }}
          >
            <div className="space-y-4 pr-2 pb-4 w-full">
              {messages.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">
                    Start a conversation with AI
                  </p>
                  <p className="text-xs mb-4">
                    Ask about your code or get help
                  </p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>💡 Try asking:</p>
                    <p>"How do I implement a React hook?"</p>
                    <p>"Explain this TypeScript error"</p>
                    <p>"Optimize this function"</p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="flex gap-3 w-full">
                  <div className="flex-shrink-0">
                    {message.role === "user" ? (
                      <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  {/* min-w-0 allows flex item to shrink */}
                  <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-xs text-slate-400 truncate">
                        {message.role === "user" ? "You" : "Assistant"} •{" "}
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.content.length > 500 && (
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {message.content.length} chars
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-200 min-w-0 overflow-x-auto">
                      <MessageContent
                        content={message.content}
                        onInsertCode={onInsertCode}
                        onCreateFile={onCreateFile}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-400">Assistant</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-slate-700/50 flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize on change
                  if (inputRef.current) {
                    inputRef.current.style.height = "auto";
                    inputRef.current.style.height = `${Math.min(
                      Math.max(inputRef.current.scrollHeight, 40),
                      200
                    )}px`;
                  }
                }}
                onKeyDown={handleKeyDown}
                onPaste={(e) => {
                  // Auto-resize after paste with a slight delay
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.style.height = "auto";
                      inputRef.current.style.height = `${Math.min(
                        Math.max(inputRef.current.scrollHeight, 40),
                        200
                      )}px`;
                    }
                  }, 0);
                }}
                placeholder="Ask AI about your code... (Shift+Enter for new line)"
                disabled={isLoading}
                className="
                  w-full resize-none overflow-y-auto break-words
                  bg-slate-900/60 border border-slate-700/50 
                  focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                  rounded-md px-3 py-2 text-sm text-slate-200
                  placeholder:text-slate-500
                  scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent
                "
                style={{
                  minHeight: "40px",
                  maxHeight: "200px",
                  height: "40px",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              />
              {/* Character count for large inputs */}
              {input.length > 200 && (
                <div className="text-xs text-slate-500 mt-1">
                  {input.length}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>

              {/* Keyboard shortcut hint */}
              <div className="text-xs text-slate-500 break-words overflow-wrap-anywhere">
                Shift+Enter for new line • Cmd+Shift+I to toggle chat
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
