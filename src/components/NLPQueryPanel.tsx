'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Code, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentResponse, AgentReasoning } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: AgentReasoning[];
  sql?: string;
  data?: Record<string, unknown>[];
}

const EXAMPLE_QUERIES = [
  "Which station hurt output most last week?",
  "Compare performance across shifts",
  "Show me defect trends over time",
  "What's causing downtime at the welding station?",
  "Which operators need additional training?",
  "How has quality changed this month?",
];

export function NLPQueryPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });

      const result: AgentResponse & { sql?: string; data?: Record<string, unknown>[] } = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        reasoning: result.reasoning,
        sql: result.sql,
        data: result.data,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleExampleClick(query: string) {
    setInput(query);
  }

  return (
    <div className="card h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="card-header flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Ask LineBalancer AI</h2>
          <p className="text-sm text-steel-400">Natural language queries with SQL generation</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-steel-800 flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-steel-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              How can I help you analyze the line?
            </h3>
            <p className="text-steel-400 mb-6 max-w-md">
              Ask me questions about bottlenecks, performance, quality, or trends. 
              I'll query the database and explain the results.
            </p>
            
            {/* Example queries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
              {EXAMPLE_QUERIES.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(query)}
                  className="p-3 text-sm text-left bg-steel-800/50 hover:bg-steel-800 rounded-lg border border-steel-700 hover:border-accent-500/50 transition-all"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={cn(
                'max-w-[80%] rounded-xl p-4',
                message.role === 'user'
                  ? 'bg-accent-600 text-white'
                  : 'bg-steel-800 border border-steel-700'
              )}>
                {/* Main content */}
                <div 
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />') 
                  }}
                />

                {/* SQL and Reasoning (for assistant messages) */}
                {message.role === 'assistant' && (message.sql || message.reasoning) && (
                  <div className="mt-3 pt-3 border-t border-steel-700">
                    <button
                      onClick={() => setShowReasoning(
                        showReasoning === message.id ? null : message.id
                      )}
                      className="flex items-center gap-2 text-xs text-steel-400 hover:text-white transition-colors"
                    >
                      {showReasoning === message.id ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Show reasoning & SQL
                    </button>
                    
                    {showReasoning === message.id && (
                      <div className="mt-3 space-y-3 animate-slide-down">
                        {/* Reasoning steps */}
                        {message.reasoning && (
                          <div className="space-y-2">
                            {message.reasoning.map((step, i) => (
                              <div key={i} className="flex gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-steel-700 flex items-center justify-center text-steel-400 flex-shrink-0">
                                  {step.step}
                                </span>
                                <div>
                                  <span className="text-steel-300">{step.thought}</span>
                                  {step.observation && (
                                    <p className="text-steel-500 mt-0.5">→ {step.observation}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Generated SQL */}
                        {message.sql && (
                          <div className="bg-steel-900 rounded-lg p-3 overflow-x-auto">
                            <div className="flex items-center gap-2 text-xs text-steel-400 mb-2">
                              <Code className="w-3 h-3" />
                              Generated SQL
                            </div>
                            <pre className="text-xs text-accent-400 font-mono whitespace-pre-wrap">
                              {message.sql}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-steel-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-steel-300" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-steel-800 border border-steel-700 rounded-xl p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent-400" />
              <span className="text-steel-400 text-sm">Analyzing data...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-steel-800">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about bottlenecks, performance, quality, trends..."
            className="input flex-1"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary px-6"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
