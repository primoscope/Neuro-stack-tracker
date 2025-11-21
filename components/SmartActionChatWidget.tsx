"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, X, Maximize2, Minimize2, Bot, Zap, Calendar, AlertCircle } from 'lucide-react';
import { sendChatMessage, createChatSession, type ChatSession, type ChatMessage } from '@/lib/gemini-chat';
import { autoScheduleCompounds, optimizeStack, type ScheduleCompound, type StackData } from '@/lib/gemini-bio-coach';

interface SmartActionChatWidgetProps {
  context: string;
  stackData?: StackData;
  compounds?: ScheduleCompound[];
  onAction?: (action: ActionType, data?: any) => void;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  minimizable?: boolean;
}

type ActionType = 
  | 're-optimize-schedule'
  | 'add-to-stack'
  | 'view-contraindications'
  | 'adjust-timing'
  | 'show-interactions'
  | 'get-recommendations';

interface ActionChip {
  label: string;
  action: ActionType;
  icon: typeof Zap;
  variant: 'primary' | 'secondary' | 'warning';
}

/**
 * Smart Action Chat Widget - Context-aware mobile-friendly AI assistant
 * Features action chips that trigger real actions, not just text replies
 */
export default function SmartActionChatWidget({
  context,
  stackData,
  compounds,
  onAction,
  position = 'bottom-right',
  minimizable = true,
}: SmartActionChatWidgetProps) {
  const [session, setSession] = useState<ChatSession>(() => createChatSession(context));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentActionChips, setCurrentActionChips] = useState<ActionChip[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  // Update session context when stackData changes
  useEffect(() => {
    if (stackData) {
      setSession(prev => ({
        ...prev,
        context: buildContextString(stackData, context),
      }));
    }
  }, [stackData, context]);

  // Generate context-aware action chips
  useEffect(() => {
    if (session.messages.length > 0) {
      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        generateActionChips(lastMessage.content);
      }
    } else {
      // Initial action chips
      setCurrentActionChips(getInitialActionChips());
    }
  }, [session.messages]);

  async function handleSendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setInput('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage(text, session);
      
      if (result) {
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, result.response],
        }));
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your API configuration.',
          timestamp: Date.now(),
        };
        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
        }));
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleActionChipClick(action: ActionType) {
    setIsLoading(true);

    try {
      switch (action) {
        case 're-optimize-schedule':
          if (compounds) {
            const result = await autoScheduleCompounds(compounds);
            if (result) {
              onAction?.(action, result);
              await handleSendMessage(`I've analyzed your stack and created an optimized schedule. Here's what I recommend: ${result.explanation}`);
            }
          }
          break;

        case 'add-to-stack':
          await handleSendMessage("What compound would you like to add to your stack? I can help research it for you.");
          break;

        case 'view-contraindications':
          if (stackData) {
            await handleSendMessage("Analyze potential contraindications and interactions in my current stack.");
          }
          break;

        case 'adjust-timing':
          if (stackData) {
            await handleSendMessage("Suggest optimal timing adjustments for my stack based on pharmacokinetics.");
          }
          break;

        case 'show-interactions':
          if (stackData) {
            await handleSendMessage("Show me all potential interactions between compounds in my stack.");
          }
          break;

        case 'get-recommendations':
          if (stackData) {
            const result = await optimizeStack(stackData);
            if (result) {
              onAction?.(action, result);
              const message = formatOptimizationResult(result);
              await handleSendMessage(`Here's my optimization analysis:\n\n${message}`);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function generateActionChips(messageContent: string) {
    const chips: ActionChip[] = [];
    const lowerContent = messageContent.toLowerCase();

    // Context-aware chip generation
    if (lowerContent.includes('schedule') || lowerContent.includes('timing')) {
      chips.push({
        label: 'Re-optimize Schedule',
        action: 're-optimize-schedule',
        icon: Calendar,
        variant: 'primary',
      });
    }

    if (lowerContent.includes('interaction') || lowerContent.includes('contraindication')) {
      chips.push({
        label: 'View Contraindications',
        action: 'view-contraindications',
        icon: AlertCircle,
        variant: 'warning',
      });
    }

    if (lowerContent.includes('add') || lowerContent.includes('consider') || lowerContent.includes('recommend')) {
      chips.push({
        label: 'Add to Stack',
        action: 'add-to-stack',
        icon: Zap,
        variant: 'secondary',
      });
    }

    // Always show recommendations option
    if (chips.length < 3) {
      chips.push({
        label: 'Get Recommendations',
        action: 'get-recommendations',
        icon: Sparkles,
        variant: 'primary',
      });
    }

    setCurrentActionChips(chips.slice(0, 3));
  }

  function getInitialActionChips(): ActionChip[] {
    return [
      {
        label: 'Re-optimize Schedule',
        action: 're-optimize-schedule',
        icon: Calendar,
        variant: 'primary',
      },
      {
        label: 'View Contraindications',
        action: 'view-contraindications',
        icon: AlertCircle,
        variant: 'warning',
      },
      {
        label: 'Get Recommendations',
        action: 'get-recommendations',
        icon: Sparkles,
        variant: 'primary',
      },
    ];
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative',
  };

  const sizeClasses = isExpanded
    ? 'w-full h-[90vh] max-w-4xl'
    : isMinimized
    ? 'w-16 h-16'
    : 'w-96 h-[600px]';

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`${positionClasses[position]} ${sizeClasses} bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform`}
      >
        <Bot className="w-8 h-8 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950" />
      </button>
    );
  }

  return (
    <div className={`${positionClasses[position]} ${sizeClasses} flex flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-2xl transition-all overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white">Bio-Coach AI</h3>
          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
            Gemini 3.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          {minimizable && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
        {session.messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Bot className="h-12 w-12 mx-auto mb-3 text-purple-400/50" />
            <p className="text-sm font-medium">Bio-Coach AI at your service!</p>
            <p className="text-xs mt-2">I can help optimize your stack, schedule compounds, and more.</p>
          </div>
        )}

        {session.messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-slate-800 text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

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

      {/* Action Chips */}
      {currentActionChips.length > 0 && !isLoading && (
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs text-gray-400 font-medium">Quick Actions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentActionChips.map((chip, idx) => {
              const Icon = chip.icon;
              const variantClasses = {
                primary: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500',
                secondary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500',
                warning: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500',
              };

              return (
                <button
                  key={idx}
                  onClick={() => handleActionChipClick(chip.action)}
                  disabled={isLoading}
                  className={`text-xs px-3 py-2 rounded-full border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium ${variantClasses[chip.variant]}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-700 p-4 bg-slate-900/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about your stack..."
            disabled={isLoading}
            rows={2}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50 text-sm"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function buildContextString(stackData: StackData, baseContext: string): string {
  const compounds = stackData.compounds.map(c => 
    `${c.name} (${c.dose})${c.timing ? ` - ${c.timing}` : ''}`
  ).join(', ');

  return `${baseContext}

Current Stack: ${compounds}
${stackData.goals ? `Goals: ${stackData.goals.join(', ')}` : ''}
${stackData.currentIssues ? `Current Issues: ${stackData.currentIssues.join(', ')}` : ''}`;
}

function formatOptimizationResult(result: any): string {
  let message = '';

  if (result.recommendations?.length > 0) {
    message += 'Recommendations:\n';
    result.recommendations.forEach((rec: any) => {
      message += `• ${rec.type.toUpperCase()}: ${rec.compound} - ${rec.reason}\n`;
    });
  }

  if (result.interactions?.length > 0) {
    message += '\nInteractions:\n';
    result.interactions.forEach((int: any) => {
      message += `• ${int.severity.toUpperCase()}: ${int.compounds.join(' + ')} - ${int.description}\n`;
    });
  }

  message += `\nSafety Score: ${result.safetyScore}/10`;

  return message;
}
