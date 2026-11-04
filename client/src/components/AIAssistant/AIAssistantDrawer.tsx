import React, { useState } from 'react';
import { X, Sparkles, Send, Copy, Check, Play, BookOpen, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuery: (queryResult: any) => void;
  schemaFields: string[];
  collectionName?: string;
}

const SAMPLE_PROMPTS = [
  'Find all active records created in 2024 with status active',
  'Total count grouped by status and sum of amount',
  'Show top 10 items sorted by price descending',
  'Find records where email contains @example.com and spend > 100'
];

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onApplyQuery,
  schemaFields,
  collectionName
}) => {
  const { geminiApiKey, setGeminiApiKey } = useConnection();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState(geminiApiKey);

  if (!isOpen) return null;

  const handleGenerate = async (queryPrompt: string) => {
    if (!queryPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.post(
        '/api/ai/generate',
        {
          prompt: queryPrompt,
          schemaFields,
          collectionName
        },
        {
          headers: geminiApiKey ? { 'x-gemini-key': geminiApiKey } : {}
        }
      );

      if (res.data.success && res.data.data) {
        setResult(res.data.data);
      } else {
        setError(res.data.error || 'Failed to generate query');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Error connecting to Gemini AI service. Ensure GEMINI_API_KEY is configured.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(tempKey.trim());
    setShowKeyInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-[var(--bg-panel)] border-l border-[var(--border-color)] flex flex-col shadow-2xl animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                AI Query Assistant
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">
                  Gemini 2.5
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Target: <span className="font-mono text-[var(--accent-cyan)]">{collectionName || 'Active Collection'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              title="Configure Custom Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Drawer Header if toggled */}
        {showKeyInput && (
          <div className="px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 space-y-2">
            <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Custom Google Gemini API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1 text-xs text-[var(--text-primary)] outline-none font-mono"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1 rounded-lg bg-[var(--accent-emerald)] text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Overrides the backend default key. Stored locally in your browser.
            </p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Prompt Box */}
          <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate(prompt);
                }
              }}
              placeholder="e.g. Find all orders over $500 sorted by date descending..."
              className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none resize-none placeholder:text-[var(--text-muted)]"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-muted)]">Ctrl + Enter to run</span>
              <button
                onClick={() => handleGenerate(prompt)}
                disabled={loading || !prompt.trim()}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Example Prompts</p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-emerald)] bg-[var(--bg-card)] transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Failed</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    result.type === 'aggregate'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {result.type === 'aggregate' ? 'Aggregation Pipeline' : 'Find Query'}
                  </span>

                  <button
                    onClick={() => handleCopyCode(JSON.stringify(result.pipeline || result.filter, null, 2))}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 text-xs flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-slate-950 border border-[var(--border-color)] text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56">
                  {JSON.stringify(result.pipeline || { filter: result.filter, projection: result.projection, sort: result.sort }, null, 2)}
                </pre>

                {result.explanation && (
                  <div className="text-xs text-[var(--text-secondary)] space-y-1 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                    <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> Explanation:
                    </p>
                    <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{result.explanation}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    onApplyQuery(result);
                    onClose();
                  }}
                  className="w-full py-2 rounded-lg bg-[var(--accent-emerald)] text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Play className="w-3.5 h-3.5" /> Apply Query to Studio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
