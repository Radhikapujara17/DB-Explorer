import React, { useState } from 'react';
import { Sparkles, X, Send, Play, Copy, Check, HelpCircle, Code2, AlertCircle } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuery: (queryObj: any) => void;
  schemaFields?: string[];
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onApplyQuery,
  schemaFields = []
}) => {
  const { selectedCollection, geminiApiKey } = useConnection();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setAiResult(null);
    setExplanationText(null);

    try {
      const res = await axios.post('/api/ai/generate', {
        prompt: prompt.trim(),
        schemaFields,
        collectionName: selectedCollection || undefined,
        apiKey: geminiApiKey || undefined
      });

      if (res.data.success) {
        setAiResult(res.data.query);
      } else {
        setError(res.data.error || 'AI generation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!aiResult) return;
    setExplaining(true);
    try {
      const res = await axios.post('/api/ai/explain', {
        query: aiResult.pipeline || aiResult.filter || aiResult,
        collectionName: selectedCollection || undefined,
        apiKey: geminiApiKey || undefined
      });
      if (res.data.success) {
        setExplanationText(res.data.explanation);
      }
    } catch (err: any) {
      setExplanationText('Failed to fetch explanation');
    } finally {
      setExplaining(false);
    }
  };

  const handleCopyCode = () => {
    const code = aiResult ? JSON.stringify(aiResult, null, 2) : '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApply = () => {
    if (aiResult) {
      onApplyQuery(aiResult);
      onClose();
    }
  };

  return (
    <div className="db-drawer">
      {/* Header */}
      <div className="db-modal-header">
        <div className="db-row-start">
          <Sparkles className="db-icon db-icon-purple" />
          <div>
            <h3 className="db-text-sm db-font-bold db-text-primary">AI Natural Language Assistant</h3>
            <p className="db-text-xs db-text-muted">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <button onClick={onClose} className="db-btn db-btn-secondary db-p-1">
          <X className="db-icon" />
        </button>
      </div>

      {/* Content */}
      <div className="db-flex-1 db-p-4 db-overflow-auto db-space-y-4">
        {/* Sample Prompt Chips */}
        <div>
          <label className="db-text-xs db-font-semibold db-text-muted uppercase tracking-wider db-py-1 db-full-w">
            Suggested Prompts
          </label>
          <div className="db-row-start db-space-y-1">
            {[
              'Find active users registered in 2024 with total spend over 500',
              'Group orders by status and calculate average order total',
              'Find top 5 most expensive products in Electronics category'
            ].map((sample, i) => (
              <button
                key={i}
                onClick={() => setPrompt(sample)}
                className="db-btn db-btn-secondary db-text-xs"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

        {/* Input prompt area */}
        <div>
          <label className="db-text-xs db-font-semibold db-text-secondary db-py-1 db-full-w">
            Describe your query requirement in plain English:
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Show me all active users sorted by total spend descending..."
            className="db-input db-text-xs db-full-w"
          />
          <div className="db-row-end db-py-2">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="db-btn db-btn-ai db-text-xs"
            >
              {loading ? (
                <span>Translating to Mongo Query...</span>
              ) : (
                <>
                  <Send className="db-icon-xs" />
                  <span>Generate Query</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="db-alert-box">
            <AlertCircle className="db-icon-sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Generated Result Output */}
        {aiResult && (
          <div className="db-card-box-active db-space-y-3">
            <div className="db-row-start db-justify-between">
              <span className="db-text-xs db-font-semibold db-text-purple db-row-start">
                <Code2 className="db-icon-sm db-icon-purple" /> Generated Code ({aiResult.type})
              </span>
              <button onClick={handleCopyCode} className="db-btn db-btn-secondary db-text-xs">
                {copied ? <Check className="db-icon-xs db-icon-emerald" /> : <Copy className="db-icon-xs" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="db-text-xs db-text-secondary db-card-box db-p-2 font-italic">
              "{aiResult.explanation}"
            </p>

            <div className="db-text-xs db-font-mono db-card-box db-text-emerald db-overflow-auto">
              <pre>{JSON.stringify(aiResult.pipeline || aiResult.filter || aiResult, null, 2)}</pre>
            </div>

            <div className="db-row-start db-justify-between db-py-2">
              <button onClick={handleExplain} disabled={explaining} className="db-btn db-btn-secondary db-text-xs">
                <HelpCircle className="db-icon-xs db-icon-purple" />
                <span>{explaining ? 'Explaining...' : 'Explain Performance'}</span>
              </button>

              <button onClick={handleApply} className="db-btn db-btn-primary db-text-xs">
                <Play className="db-icon-xs fill-current" />
                <span>Apply to Explorer</span>
              </button>
            </div>

            {explanationText && (
              <div className="db-card-box db-text-xs db-text-secondary db-p-3">
                <h5 className="db-font-semibold db-text-purple db-py-1">AI Explanation & Indexing Tips:</h5>
                {explanationText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
