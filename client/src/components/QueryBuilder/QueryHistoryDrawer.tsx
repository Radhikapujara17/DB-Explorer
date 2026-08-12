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
    <div className="db-drawer">
      <div className="db-modal-header">
        <div className="db-row-start">
          <Bookmark className="db-icon-sm db-icon-amber" />
          <h3 className="db-text-sm db-font-bold db-text-primary">Saved Snippets & Execution History</h3>
        </div>
        <button onClick={onClose} className="db-btn db-btn-secondary db-p-1">
          <X className="db-icon-sm" />
        </button>
      </div>

      <div className="db-sub-header">
        <div className="db-row-start">
          <button
            onClick={() => setActiveTab('saved')}
            className={`db-sub-header-btn ${
              activeTab === 'saved' ? 'active-emerald' : ''
            }`}
          >
            Saved Snippets ({savedQueries.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`db-sub-header-btn ${
              activeTab === 'history' ? 'active-purple' : ''
            }`}
          >
            Query History ({queryHistory.length})
          </button>
        </div>

        {activeTab === 'saved' && (
          <button
            onClick={() => setShowSaveInput(!showSaveInput)}
            className="db-btn db-btn-secondary db-text-xs db-text-amber"
          >
            <Plus className="db-icon-xs" /> Save Current
          </button>
        )}
      </div>

      <div className="db-flex-1 db-p-4 db-overflow-auto db-space-y-3">
        {showSaveInput && (
          <div className="db-card-box-active db-space-y-2">
            <h4 className="db-text-xs db-font-bold db-text-amber">Save Active Query Snippet</h4>
            <input
              type="text"
              placeholder="e.g. Active Admin Users Spend > 1000"
              value={snippetName}
              onChange={(e) => setSnippetName(e.target.value)}
              className="db-input db-full-w db-text-xs"
            />
            <div className="db-row-end db-py-1">
              <button onClick={() => setShowSaveInput(false)} className="db-btn db-btn-secondary db-text-xs">Cancel</button>
              <button onClick={handleSaveSnippet} className="db-btn db-btn-primary db-text-xs">Save</button>
            </div>
          </div>
        )}

        {activeTab === 'saved' ? (
          savedQueries.length === 0 ? (
            <div className="db-p-6 db-text-center db-text-xs db-text-muted">No saved query snippets yet.</div>
          ) : (
            savedQueries.map(q => (
              <div key={q.id} className="db-card-box db-space-y-2">
                <div className="db-row-start db-justify-between">
                  <span className="db-font-semibold db-text-xs db-text-primary">{q.name}</span>
                  <button onClick={() => deleteQuerySnippet(q.id)} className="db-btn db-btn-danger db-p-1">
                    <Trash2 className="db-icon-xs" />
                  </button>
                </div>
                <div className="db-text-xs db-font-mono db-card-box db-p-2 db-text-emerald db-overflow-auto">
                  <pre>{JSON.stringify(q.query, null, 2)}</pre>
                </div>
                <button
                  onClick={() => { onApplyQuery(q.query); onClose(); }}
                  className="db-btn db-btn-secondary db-text-xs db-full-w"
                >
                  <Play className="db-icon-xs fill-current" /> Apply Snippet
                </button>
              </div>
            ))
          )
        ) : (
          queryHistory.length === 0 ? (
            <div className="db-p-6 db-text-center db-text-xs db-text-muted">No recent query execution history.</div>
          ) : (
            queryHistory.map((item, idx) => (
              <div key={idx} className="db-card-box db-space-y-2">
                <span className="db-text-xs db-font-mono db-text-muted">Executed at {item.timestamp}</span>
                <div className="db-text-xs db-font-mono db-card-box db-p-2 db-text-cyan db-overflow-auto">
                  <pre>{JSON.stringify(item.query, null, 2)}</pre>
                </div>
                <button
                  onClick={() => { onApplyQuery(item.query); onClose(); }}
                  className="db-btn db-btn-secondary db-text-xs db-full-w"
                >
                  <Play className="db-icon-xs fill-current" /> Re-run Query
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
