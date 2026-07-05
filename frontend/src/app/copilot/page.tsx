'use client';

import { useState, useRef, useEffect } from 'react';
import { Leaf, ChevronDown, ChevronRight, Send, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

type Citation = {
  document: string;
  type: string;
  relevance: number;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: 'high' | 'medium' | 'low';
  timestamp: Date;
};

const SUGGESTIONS = [
  "Pump P-201 startup procedure",
  "OISD compliance check",
  "Heat exchanger maintenance schedule",
  "Safety requirements for confined space"
];

const DOC_TYPES = [
  { label: 'All Docs', value: '' },
  { label: 'SOPs', value: 'SOP' },
  { label: 'Regulations', value: 'REGULATION' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'P&IDs', value: 'PID' },
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [showSources, setShowSources] = useState<{ [messageId: string]: boolean }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll on new messages or loading state change
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleSources = (id: string) => {
    setShowSources(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Attempt to auto-expand textarea for new text
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
      }, 0);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3001/api/query', {
        question: userMessage.content,
        doc_type: docTypeFilter || undefined
      });

      const data = response.data;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        confidence: data.confidence,
        timestamp: new Date(data.timestamp || Date.now())
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'An error occurred while communicating with the PlantMind API.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDocTypeBadgeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'SOP': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'REGULATION': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'MAINTENANCE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'INSPECTION': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 bg-slate-950">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm z-10">
        <h2 className="text-2xl font-semibold text-slate-100">Expert Knowledge Copilot</h2>
        <p className="text-slate-400 mt-1">Ask questions, verify procedures, and retrieve contextual answers from the industrial knowledge base.</p>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <Leaf className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-medium text-slate-100 mb-2">How can I help you today?</h3>
            <p className="text-slate-400">
              I am trained on your facility's operational guidelines, P&IDs, safety protocols, and maintenance history. 
              Ask a question below to get started.
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              
              {/* Avatar for Assistant */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0 border border-emerald-500/30">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] flex flex-col gap-3 p-4",
                msg.role === 'user' 
                  ? "bg-emerald-500/20 border border-emerald-500/30 rounded-2xl rounded-tr-sm text-slate-100" 
                  : "bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm text-slate-200"
              )}>
                
                {/* Message Content */}
                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                  {msg.content}
                </div>
                
                {/* Assistant Metadata (Confidence & Citations) */}
                {msg.role === 'assistant' && (msg.confidence || (msg.citations && msg.citations.length > 0)) && (
                  <div className="flex flex-col gap-3 mt-2 pt-3 border-t border-slate-700/50">
                    
                    {/* Confidence Badge */}
                    {msg.confidence && (
                      <div className="flex items-center">
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-full border",
                          msg.confidence === 'high' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                          msg.confidence === 'medium' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                          "bg-red-500/20 text-red-400 border-red-500/30"
                        )}>
                          {msg.confidence.charAt(0).toUpperCase() + msg.confidence.slice(1)} Confidence
                        </span>
                      </div>
                    )}

                    {/* Sources Collapsible */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors self-start"
                        >
                          {showSources[msg.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          Sources ({msg.citations.length})
                        </button>
                        
                        {showSources[msg.id] && (
                          <div className="flex flex-col gap-2 mt-1 pl-1">
                            {msg.citations.map((cit, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-2.5 rounded border border-slate-700/50">
                                <div className="flex flex-col gap-1 overflow-hidden">
                                  <span className="text-sm font-medium text-slate-300 truncate">{cit.document}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider", getDocTypeBadgeColor(cit.type))}>
                                      {cit.type}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">{cit.relevance}% Match</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Animated State */}
        {loading && (
          <div className="flex w-full justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 mt-1 border border-emerald-500/30">
              <Leaf className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center justify-center h-[52px]">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Banner */}
        {error && (
          <div className="flex w-full justify-center my-4">
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 shadow-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area (Fixed Bottom) */}
      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          
          {/* Quick Query Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SUGGESTIONS.map((sug, idx) => (
              <button 
                key={idx}
                onClick={() => handleSuggestionClick(sug)}
                className="whitespace-nowrap px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            {/* Doc Type Filter */}
            <div className="flex-shrink-0 mb-1 w-36">
              <select 
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 outline-none transition-colors"
              >
                {DOC_TYPES.map(doc => (
                  <option key={doc.value} value={doc.value}>{doc.label}</option>
                ))}
              </select>
            </div>

            {/* Input Textarea */}
            <div className="relative flex-1 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask PlantMind... (Press Enter to send, Shift+Enter for new line)"
                className="w-full bg-transparent text-slate-100 text-sm p-3 pr-12 outline-none resize-none overflow-y-auto min-h-[46px] max-h-[120px]"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || loading}
                className="absolute right-2 bottom-2 p-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
