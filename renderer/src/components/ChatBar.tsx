import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
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
}

export function ChatBar({
  isOpen,
  onToggle,
  width,
  onWidthChange,
}: ChatBarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to format message content
  const formatMessageContent = (content: string, messageId: string) => {
    // Check if content looks like code (contains common code patterns)
    const isCode =
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

    if (isCode) {
      return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-md p-3 font-mono text-xs overflow-x-auto relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(content, messageId)}
            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy code"
          >
            {copiedMessageId === messageId ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <pre className="whitespace-pre-wrap break-words pr-8">{content}</pre>
        </div>
      );
    }

    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  };

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
      className="flex flex-col h-full bg-slate-900 border-l border-slate-700/50 overflow-hidden"
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
          <ScrollArea className="flex-1 p-3 h-full overflow-hidden">
            <div className="space-y-4 pr-2">
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
                <div key={message.id} className="flex gap-3">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">
                        {message.role === "user" ? "You" : "Assistant"} •{" "}
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.content.length > 500 && (
                        <span className="text-xs text-slate-500">
                          {message.content.length} chars
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-200 max-h-96 overflow-y-auto">
                      {formatMessageContent(message.content, message.id)}
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
          <div className="p-3 border-t border-slate-700/50">
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
                  w-full resize-none overflow-y-auto
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
              <div className="text-xs text-slate-500">
                Shift+Enter for new line • Cmd+Shift+I to toggle chat
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
