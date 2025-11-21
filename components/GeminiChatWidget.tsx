"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, X, Maximize2, Minimize2, MessageCircle } from "lucide-react";
import { sendChatMessage, createChatSession, type ChatSession, type ChatMessage } from "@/lib/gemini-chat";
import { Compound, DoseItem } from "@/lib/types";

interface GeminiChatWidgetProps {
  compounds: Compound[];
  activeDoses: DoseItem[];
  onActionChipClick?: (action: ActionChipData) => void;
}

export interface ActionChipData {
  type: "move_time" | "add_compound" | "analyze_synergy" | "adjust_dose" | "general";
  compoundName?: string;
  suggestedTime?: string;
  suggestedDose?: number;
  message: string;
}

/**
 * GeminiChatWidget - Persistent, context-aware chat interface docked at bottom of screen
 * Features "Action Chips" that trigger actual state updates
 */
export function GeminiChatWidget({
  compounds,
  activeDoses,
  onActionChipClick,
}: GeminiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  // Update context when compounds or doses change
  useEffect(() => {
    if (isOpen && session) {
      const newContext = buildStackContext(compounds, activeDoses);
      setSession((prev) => (prev ? { ...prev, context: newContext } : null));
    }
  }, [compounds, activeDoses, isOpen]);

  // Initialize session when opened
  useEffect(() => {
    if (isOpen && !session) {
      const context = buildStackContext(compounds, activeDoses);
      const newSession = createChatSession(context);
      setSession(newSession);
    }
  }, [isOpen, session, compounds, activeDoses]);

  async function handleSendMessage(messageText?: string) {
    if (!session) return;
    
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, userMessage],
      };
    });

    setInput("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(text, session);

      if (result) {
        // Parse action chips from response
        const actionChips = parseActionChips(result.response.content, result.suggestions || []);
        
        const messageWithChips: ChatMessage = {
          ...result.response,
          suggestions: actionChips.map((chip) => chip.label),
        };

        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, messageWithChips],
          };
        });
      } else {
        // Error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please check your API configuration and try again.",
          timestamp: Date.now(),
        };
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, errorMessage],
          };
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleActionChipClick(chipLabel: string) {
    // Parse the chip label to create action data
    const actionData = parseChipToAction(chipLabel);
    
    if (onActionChipClick) {
      onActionChipClick(actionData);
    }
    
    // Also send as a follow-up message to get more context
    handleSendMessage(`I want to: ${chipLabel}`);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // Collapsed state (floating button)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
        aria-label="Open Bio-Coach Chat"
      >
        <Sparkles className="w-6 h-6" />
        <span className="hidden sm:inline text-sm font-medium">Bio-Coach</span>
      </button>
    );
  }

  // Open state
  return (
    <div
      className={`fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl transition-all ${
        isExpanded
          ? "inset-4"
          : "bottom-4 right-4 w-full sm:w-[400px] h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white">Bio-Coach</h3>
          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
            Gemini 3.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            aria-label={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50" style={{ height: isExpanded ? "calc(100% - 140px)" : "calc(600px - 140px)" }}>
        {!session?.messages || session.messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-purple-400/50" />
            <p className="text-sm">Your AI-powered Bio-Coach</p>
            <p className="text-xs mt-2">Ask about interactions, timing, dosages, and optimization!</p>
          </div>
        ) : (
          session.messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>

              {/* Action Chips */}
              {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionChipClick(suggestion)}
                      disabled={isLoading}
                      className="text-xs px-3 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 text-purple-200 rounded-full border border-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              <span className="text-sm text-gray-300">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4 bg-slate-900/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your stack..."
            disabled={isLoading}
            rows={2}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50 text-sm"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/**
 * Build context string from current stack
 */
function buildStackContext(compounds: Compound[], activeDoses: DoseItem[]): string {
  const activeCompoundIds = new Set(activeDoses.map((d) => d.compoundId));
  const activeCompounds = compounds.filter((c) => activeCompoundIds.has(c.id));

  if (activeCompounds.length === 0) {
    return "User has no active doses logged yet.";
  }

  const compoundsList = activeDoses
    .map((dose) => {
      const compound = compounds.find((c) => c.id === dose.compoundId);
      if (!compound) return null;
      const time = new Date(dose.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `- ${compound.name}: ${dose.dose}${compound.unit} at ${time}`;
    })
    .filter(Boolean)
    .join("\n");

  return `Current Stack:\n${compoundsList}`;
}

/**
 * Parse action chips from AI response and suggestions
 */
function parseActionChips(
  response: string,
  suggestions: string[]
): Array<{ label: string; action: ActionChipData }> {
  const chips: Array<{ label: string; action: ActionChipData }> = [];

  suggestions.forEach((suggestion) => {
    const action = parseChipToAction(suggestion);
    chips.push({ label: suggestion, action });
  });

  return chips;
}

/**
 * Parse a chip label into actionable data
 */
function parseChipToAction(chipLabel: string): ActionChipData {
  const lowerLabel = chipLabel.toLowerCase();

  // Pattern: "Move X to Y"
  if (lowerLabel.includes("move") && lowerLabel.includes("to")) {
    const match = chipLabel.match(/move\s+([^\s]+)\s+to\s+(.+)/i);
    if (match) {
      return {
        type: "move_time",
        compoundName: match[1],
        suggestedTime: match[2],
        message: chipLabel,
      };
    }
  }

  // Pattern: "Add X"
  if (lowerLabel.startsWith("add ")) {
    const match = chipLabel.match(/add\s+(.+)/i);
    if (match) {
      return {
        type: "add_compound",
        compoundName: match[1],
        message: chipLabel,
      };
    }
  }

  // Pattern: "Analyze synergy" or "Check interactions"
  if (lowerLabel.includes("synergy") || lowerLabel.includes("interaction") || lowerLabel.includes("analyze")) {
    return {
      type: "analyze_synergy",
      message: chipLabel,
    };
  }

  // Pattern: "Adjust X dose"
  if (lowerLabel.includes("adjust") && lowerLabel.includes("dose")) {
    const match = chipLabel.match(/adjust\s+([^\s]+)/i);
    if (match) {
      return {
        type: "adjust_dose",
        compoundName: match[1],
        message: chipLabel,
      };
    }
  }

  // Default: general action
  return {
    type: "general",
    message: chipLabel,
  };
}
