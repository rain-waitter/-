/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Trash2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const formatReferences = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setOutput('');

    try {
      const model = "gemini-3-flash-preview";
      const prompt = `
        I will provide you with a list of bibliographic references or partial information about them.
        Your task is to:
        1. Process exactly the number of items provided in the input. Do not add or skip items.
        2. For each item:
           - Use Google Search to find the correct metadata.
           - If found and unique: Format in APA 7th edition.
           - If multiple matches are found (Ambiguous): Choose the most likely one but add a prefix "[AMBIGUOUS]" and a brief note about other possibilities.
           - If not found: Add a prefix "[NOT FOUND]" and keep the original input text.
        3. Number the output list sequentially (1, 2, 3...).
        4. Maintain a 1:1 mapping with the input items.
        5. Provide a summary at the top: "Total Items Processed: X | Found: Y | Ambiguous: Z | Not Found: W".

        Input References (one per line or clearly separated):
        ${input}
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      if (text) {
        setOutput(text);
      } else {
        throw new Error("No output received from the model.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while formatting references.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearInput = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">APA 7th Formatter</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-black/40 uppercase tracking-widest">
            <span>Precision</span>
            <span className="w-1 h-1 bg-black/10 rounded-full" />
            <span>APA 7th Edition</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Input Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-bold uppercase tracking-wider text-black/60 flex items-center gap-2">
                  <FileText size={14} />
                  Input References
                </h2>
                <p className="text-xs text-black/40 italic">Paste your raw citations or titles below</p>
              </div>
              <button 
                onClick={clearInput}
                className="p-2 text-black/40 hover:text-red-500 transition-colors"
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Smith 2023 climate change paper...&#10;Einstein, A. (1905). On the electrodynamics of moving bodies."
                className="w-full h-[400px] p-6 bg-white border border-black/5 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none font-mono text-sm leading-relaxed"
              />
              <div className="absolute bottom-4 left-4 text-[10px] font-mono text-black/40 bg-white/80 px-2 py-1 rounded border border-black/5">
                Estimated Items: {input.split('\n').filter(line => line.trim()).length}
              </div>
              <div className="absolute bottom-4 right-4 text-[10px] font-mono text-black/20 group-focus-within:text-emerald-500/40 transition-colors">
                {input.length} characters
              </div>
            </div>

            <button
              onClick={formatReferences}
              disabled={loading || !input.trim()}
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                loading || !input.trim() 
                  ? 'bg-black/5 text-black/20 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Searching & Formatting...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Process References
                </>
              )}
            </button>
          </section>

          {/* Output Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-bold uppercase tracking-wider text-black/60 flex items-center gap-2">
                  <Check size={14} />
                  APA 7th Output
                </h2>
                <p className="text-xs text-black/40 italic">Formatted and verified results</p>
              </div>
              {output && (
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-black/5 text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 transition-all text-emerald-600"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy All'}
                </button>
              )}
            </div>

            <div className="relative h-[400px] bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-10"
                  >
                    <div className="relative">
                      <Loader2 size={40} className="text-emerald-600 animate-spin" />
                      <div className="absolute inset-0 blur-xl bg-emerald-400/20 animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-black/60 uppercase tracking-widest animate-pulse">Analyzing Sources</p>
                      <p className="text-[10px] text-black/30 italic">Consulting Google Search for metadata...</p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                {error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-red-600">Formatting Failed</p>
                      <p className="text-xs text-black/40 max-w-[200px]">{error}</p>
                    </div>
                    <button 
                      onClick={formatReferences}
                      className="text-xs font-bold uppercase tracking-widest text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Try Again
                    </button>
                  </div>
                ) : output ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-sm max-w-none prose-emerald"
                  >
                    <div className="markdown-body">
                      <ReactMarkdown>{output}</ReactMarkdown>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20">
                    <BookOpen size={48} />
                    <p className="text-sm font-medium">Your formatted references will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                <AlertCircle size={10} />
                Pro Tip
              </h3>
              <p className="text-[11px] text-emerald-900/60 leading-relaxed">
                You don't need full citations. Even partial titles or "Author Year Topic" will work as the AI searches for the original source.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-black/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[10px] font-mono text-black/30 uppercase tracking-widest">
            Built with Gemini 3 Flash & Google Search
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-black/40">
            <a href="#" className="hover:text-emerald-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">APA 7th Guide</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        
        .markdown-body {
          font-family: inherit;
          line-height: 1.8;
        }
        .markdown-body p {
          margin-bottom: 1.5rem;
          padding-left: 2rem;
          text-indent: -2rem;
        }
      `}</style>
    </div>
  );
}
