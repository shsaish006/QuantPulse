'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { chatWithAI } from '@/lib/backend.actions';
import { Bot, User, Send, Sparkles, RefreshCw, Cpu, BrainCircuit, Table, Scale, AreaChart } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '## Welcome to QuantPulse AI terminal\n\nI am a quantitative financial assistant specialized in **algorithmic forecasting** and **risk parity optimization**.\n\n### Core Capabilities\n- Run iterative autoregressive forecasts (Ridge regression models) with 95% confidence intervals.\n- Compute optimal asset weights using non-linear convex optimization solvers to equalize risk contributions.\n- Synthesize real-time technical indicators (RSI, MACD, Bollinger Bands, ROC) from yfinance daily pricing.\n\nHow can I support your quantitative research today?',
    },
  ]);

  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestions template
  const suggestions = [
    {
      label: 'Predict TSLA Horizon',
      query: 'Predict the price of TSLA for next week.',
      icon: AreaChart,
    },
    {
      label: 'Optimize Multi-Asset Portfolio',
      query: 'Optimize a portfolio of AAPL, MSFT, TSLA, and GLD using risk parity.',
      icon: Scale,
    },
    {
      label: 'Momentum Check NVDA',
      query: 'What are the current technical indicators for NVDA?',
      icon: Table,
    },
    {
      label: 'Risk Parity Theory',
      query: 'Explain the mathematical framework of Risk Parity portfolio construction.',
      icon: BrainCircuit,
    },
  ];

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const queryText = customQuery || input;
    if (!queryText.trim()) return;

    if (!customQuery) setInput('');

    // Add user message
    const updatedMessages = [...messages, { role: 'user', content: queryText } as Message];
    setMessages(updatedMessages);

    // Call API inside transition
    startTransition(async () => {
      try {
        const response = await chatWithAI(updatedMessages);
        setMessages((prev) => [...prev, { role: 'assistant', content: response.response }]);
      } catch (error) {
        console.error(error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'An error occurred while connecting to the python backend. Verify that uvicorn is running.',
          },
        ]);
      }
    });
  };

  // Basic Markdown Renderer for quantitative tables and lists
  const renderMessageContent = (text: string) => {
    // Simple regex replacements for clean rendering of lists, tables, and bold items
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // 1. Headers
      if (line.startsWith('## ')) {
        return (
          <h2 key={lineIdx} className="text-xl font-bold text-white mt-4 mb-2 first:mt-0">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={lineIdx} className="text-lg font-bold text-green-400 mt-3 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      }

      // 2. Table Rows
      if (line.startsWith('|') && line.endsWith('|')) {
        // Skip separator lines
        if (line.includes('---')) return null;

        const cells = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        const isHeader = lineIdx > 0 && lines[lineIdx - 1].startsWith('|') && lines[lineIdx + 1]?.includes('---');
        const isActualHeader = lineIdx === 0 || (lineIdx > 0 && !lines[lineIdx - 1].startsWith('|'));

        if (isActualHeader) {
          return (
            <div key={lineIdx} className="overflow-x-auto my-2">
              <table className="w-full text-xs text-left border-collapse border border-dark-400">
                <thead>
                  <tr className="bg-dark-900 border-b border-dark-400">
                    {cells.map((cell, idx) => (
                      <th key={idx} className="p-2 font-semibold text-purple-100/70 border-r border-dark-400">
                        {cell.replace(/\*\*/g, '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.slice(lineIdx + 2).map((tblLine, tblIdx) => {
                    if (!tblLine.startsWith('|')) return null;
                    const tblCells = tblLine
                      .split('|')
                      .slice(1, -1)
                      .map((c) => c.trim());
                    return (
                      <tr key={tblIdx} className="border-b border-dark-400/50 hover:bg-dark-900/10">
                        {tblCells.map((cell, idx) => (
                          <td key={idx} className="p-2 border-r border-dark-400 text-purple-100 font-medium">
                            {cell.startsWith('**') && cell.endsWith('**') ? (
                              <strong className="text-white">{cell.replace(/\*\*/g, '')}</strong>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }
        // Skip other rows as they are rendered inside tbody block
        return null;
      }

      // 3. Bullet points
      if (line.startsWith('- ')) {
        const parts = line.replace('- ', '').split('**');
        return (
          <li key={lineIdx} className="ml-4 list-disc text-sm text-purple-100 mt-1">
            {parts.map((part, pIdx) =>
              pIdx % 2 === 1 ? <strong key={pIdx} className="text-white">{part}</strong> : part,
            )}
          </li>
        );
      }

      // 4. LaTeX mathematical display
      if (line.startsWith('$$') && line.endsWith('$$')) {
        return (
          <div key={lineIdx} className="bg-dark-900/80 p-3 rounded-lg border border-dark-400 text-center font-mono my-3 text-green-400 overflow-x-auto text-sm">
            {line.replace(/\$\$/g, '')}
          </div>
        );
      }

      // 5. Bold items in standard text
      const boldParts = line.split('**');
      if (boldParts.length > 1) {
        return (
          <p key={lineIdx} className="text-sm text-purple-100 leading-relaxed mb-2 last:mb-0">
            {boldParts.map((part, pIdx) =>
              pIdx % 2 === 1 ? <strong key={pIdx} className="text-white">{part}</strong> : part,
            )}
          </p>
        );
      }

      return (
        <p key={lineIdx} className="text-sm text-purple-100 leading-relaxed mb-2 last:mb-0">
          {line}
        </p>
      );
    });
  };

  return (
    <main className="main-container max-w-360 mx-auto px-4 sm:px-6 py-6 md:py-8 h-[calc(100vh-6rem)] flex flex-col gap-6">
      {/* Upper Title */}
      <div className="p-4 bg-dark-500/40 rounded-xl border border-dark-400 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-green-400 size-6" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">QuantPulse Research Assistant</h2>
            <p className="text-[10px] text-purple-100/50">Asynchronous statistical modeling and portfolio weights optimization</p>
          </div>
        </div>
        <div className="bg-green-500/10 text-green-400 text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1.5 animate-pulse">
          <Cpu size={12} /> SECURE QUANT CHANNEL
        </div>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Suggestion Panel (Sidebar in large screens) */}
        <div className="lg:col-span-1 bg-dark-500 rounded-2xl border border-purple-600/10 p-5 space-y-4 flex flex-col justify-start max-lg:hidden">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-dark-400">
            <Sparkles className="text-green-400 size-4" /> Quick Templates
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {suggestions.map((sug, idx) => {
              const IconComp = sug.icon;
              return (
                <button
                  key={idx}
                  onClick={(e) => handleSubmit(e, sug.query)}
                  className="w-full text-left p-3.5 bg-dark-900/60 hover:bg-green-500/5 hover:border-green-500/20 active:scale-[0.98] transition-all rounded-xl border border-dark-400/80 cursor-pointer flex gap-3 items-start"
                >
                  <IconComp className="text-green-400 size-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{sug.label}</h4>
                    <p className="text-[10px] text-purple-100/40 mt-1 line-clamp-2">{sug.query}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-3 bg-dark-900/40 rounded-xl border border-dark-400/50 text-[10px] text-purple-100/40 leading-relaxed">
            QuantPulse AI provides analytical reports compiled via real-time statistical modeling. Not financial advice.
          </div>
        </div>

        {/* Message Thread Panel */}
        <div className="lg:col-span-3 bg-dark-500 rounded-2xl border border-purple-600/10 flex flex-col min-h-0 overflow-hidden shadow-xl">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {msg.role === 'assistant' && (
                  <div className="size-9 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Bot size={18} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 border ${
                    msg.role === 'user'
                      ? 'bg-green-500 text-dark-900 border-green-400 font-medium'
                      : 'bg-dark-900/60 text-purple-100 border-dark-400 space-y-2'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="space-y-1.5 select-text">{renderMessageContent(msg.content)}</div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="size-9 bg-dark-400 border border-dark-400 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex gap-4 justify-start">
                <div className="size-9 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot size={18} />
                </div>
                <div className="bg-dark-900/60 text-purple-100 border border-dark-400 rounded-2xl px-5 py-4 flex items-center gap-2">
                  <RefreshCw className="animate-spin text-green-400 size-4" />
                  <span className="text-xs text-purple-100/60 font-semibold">Running statistical regressions...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <div className="p-4 border-t border-dark-400 bg-dark-900/30 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about stock forecast or risk parity (e.g. Optimize AAPL, TSLA, GLD)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isPending}
                className="flex-1 bg-dark-900 border border-dark-400/80 rounded-xl px-4 py-3 text-white placeholder-purple-100/40 text-sm focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="bg-green-500 hover:bg-green-400 active:scale-95 text-dark-900 px-5 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
