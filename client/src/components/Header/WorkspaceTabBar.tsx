import React from 'react';
import { useConnection } from '../../context/ConnectionContext';
import { Table, X } from 'lucide-react';

export const WorkspaceTabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab } = useConnection();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[var(--bg-panel)] border-b border-[var(--border-color)] px-2 sm:px-3 flex items-center gap-1 overflow-x-auto no-scrollbar flex-shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium cursor-pointer border-b-2 transition-all duration-150 whitespace-nowrap select-none rounded-t-md ${
              isActive
                ? 'border-[var(--accent-emerald)] text-[var(--text-primary)] bg-[var(--bg-card)] shadow-sm'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Table className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-muted)]'}`} />
            <span className="font-mono text-xs font-semibold">{tab.collectionName}</span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono opacity-80">({tab.dbName})</span>
            
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
