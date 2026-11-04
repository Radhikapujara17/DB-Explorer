import React from 'react';
import { useConnection } from '../../context/ConnectionContext';
import { Database, Table, X, Plus } from 'lucide-react';

export const WorkspaceTabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab, selectedDb, selectedCollection } = useConnection();

  if (tabs.length === 0) {
    if (!selectedDb || !selectedCollection) return null;
    return (
      <div className="w-full bg-[var(--bg-panel)] border-b border-[var(--border-color)] px-4 py-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
          <span>{selectedDb}</span>
          <span>/</span>
          <Table className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
          <span className="font-semibold text-[var(--text-primary)]">{selectedCollection}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-panel)] border-b border-[var(--border-color)] px-2 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group relative flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer border-b-2 transition-all duration-150 whitespace-nowrap select-none ${
              isActive
                ? 'border-[var(--accent-emerald)] text-[var(--text-primary)] bg-[var(--bg-active)] shadow-sm'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Table className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-muted)]'}`} />
            <span className="font-mono text-xs">{tab.collectionName}</span>
            <span className="text-[10px] text-[var(--text-muted)] opacity-75">({tab.dbName})</span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="p-0.5 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-rose-400 transition-colors ml-1"
              title="Close Tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
