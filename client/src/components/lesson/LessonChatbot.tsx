import React, { useState, useEffect, useRef } from 'react';
import { ChatMessageItem } from '../../types/index.js';
import { chatApi } from '../../services/api.js';
import { Bot, Send, Trash2, X, Sparkles, MessageSquare, Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';

interface LessonChatbotProps {
  lessonId: string;
  lessonTitle: string;
}

export const LessonChatbot: React.FC<LessonChatbotProps> = ({ lessonId, lessonTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, lessonId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const history = await chatApi.getLessonChatHistory(lessonId);
      setMessages(history);
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    const currentQ = inputQuestion.trim();
    setInputQuestion('');

    // Optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: currentQ,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await chatApi.askQuestion(lessonId, currentQ);
      // Replace with actual messages
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), response.userMessage, response.assistantMessage]);
    } catch (error: any) {
      showToast(error.message || 'Failed to get answer from AI Tutor', 'error');
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history for this lesson?')) return;
    try {
      await chatApi.clearChatHistory(lessonId);
      setMessages([]);
      showToast('Chat history cleared', 'info');
    } catch (err) {
      showToast('Failed to clear chat history', 'error');
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold shadow-2xl hover:scale-105 transition-all duration-200 group border border-emerald-300/40"
        >
          <Bot className="w-5 h-5 text-slate-950" />
          <span className="text-sm">Ask AI Tutor</span>
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  AI Learning Buddy
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </h4>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  Tutor for: {lessonTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  title="Clear history"
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/50">
            {isFetchingHistory ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-emerald-400" /> Loading previous questions...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-semibold text-slate-200">Got questions about this lesson?</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                  Ask for code explanations, analogies, step-by-step examples, or quiz preparation tips!
                </p>
                <div className="mt-4 flex flex-col gap-1.5 w-full">
                  <button
                    onClick={() => setInputQuestion('Can you explain the main concept with a real-world analogy?')}
                    className="text-xs text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors"
                  >
                    💡 "Can you explain the main concept with an analogy?"
                  </button>
                  <button
                    onClick={() => setInputQuestion('How do professionals use this in production?')}
                    className="text-xs text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors"
                  >
                    🛠️ "How do professionals use this in production?"
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.role === 'user' ? 'You' : 'AI Learning Buddy'}
                  </span>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-800/80 p-2.5 rounded-xl max-w-[70%] border border-emerald-500/20">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking & analyzing lesson context...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask anything about this lesson..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isLoading}
              className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
