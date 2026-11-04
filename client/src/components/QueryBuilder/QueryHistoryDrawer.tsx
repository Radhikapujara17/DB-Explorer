import React, { useState } from 'react';
import { History, Bookmark, Trash2, Play, X, Plus } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';

interface QueryHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuery: (queryObj: any) => void;
  currentQueryToSave?: any;
}

export const QueryHistoryDrawer: React.FC<QueryHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onApplyQuery,
  currentQueryToSave
}) => {
  const { queryHistory, savedQueries, saveQuerySnippet, deleteQuerySnippet, selectedCollection } = useConnection();
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [snippetName, setSnippetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  if (!isOpen) return null;

  const handleSaveSnippet = () => {
    if (!snippetName.trim() || !currentQueryToSave) return;
    saveQuerySnippet(snippetName.trim(), currentQueryToSave, selectedCollection || undefined);
    setSnippetName('');
    setShowSaveInput(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[var(--bg-panel)] border-l border-[var(--border-color)] flex flex-col shadow-2xl animate-slide-left text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Snippets & History</h3>
              <p className="text-xs text-[var(--text-muted)]">Saved MongoDB queries & execution history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch bar */}
        <div className="px-5 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-panel)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'saved'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Saved Snippets ({savedQueries.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              History ({queryHistory.length})
            </button>
          </div>

          {activeTab === 'saved' && (
            <button
              onClick={() => setShowSaveInput(!showSaveInput)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Save Active
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {showSaveInput && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5 animate-slide-down">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" /> Save Active Query Snippet
              </h4>
              <input
                type="text"
                placeholder="e.g. Active Admin Users Spend > 1000"
                value={snippetName}
                onChange={(e) => setSnippetName(e.target.value)}
                className="input-field text-xs font-sans"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="px-2.5 py-1 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSnippet}
                  disabled={!snippetName.trim()}
                  className="btn btn-primary text-xs py-1 px-3 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {activeTab === 'saved' ? (
            savedQueries.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
                No saved query snippets yet. Save your active query above.
              </div>
            ) : (
              savedQueries.map(q => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 hover:border-[var(--border-glow)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-[var(--text-primary)]">{q.name}</span>
                      {q.collectionName && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)] font-mono">
                          {q.collectionName}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteQuerySnippet(q.id)}
                      className="p-1 rounded text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete snippet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs font-mono p-2.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-color)] text-emerald-400 overflow-x-auto max-h-36">
                    <pre>{JSON.stringify(q.query, null, 2)}</pre>
                  </div>
                  <button
                    onClick={() => { onApplyQuery(q.query); onClose(); }}
                    className="btn btn-secondary text-xs w-full py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current text-emerald-400" /> Apply Snippet
                  </button>
                </div>
              ))
            )
          ) : (
            queryHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
                No recent query execution history. Run queries from the Explorer to track them here.
              </div>
            ) : (
              queryHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 hover:border-[var(--border-glow)] transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
                    <span className="flex items-center gap-1">
                      <History className="w-3 h-3 text-purple-400" />
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs font-mono p-2.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-color)] text-cyan-400 overflow-x-auto max-h-36">
                    <pre>{JSON.stringify(item.query, null, 2)}</pre>
                  </div>
                  <button
                    onClick={() => { onApplyQuery(item.query); onClose(); }}
                    className="btn btn-secondary text-xs w-full py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current text-cyan-400" /> Re-run Query
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
