import React from 'react';
import { Table, X, Plus } from 'lucide-react';
import { useConnection, CollectionTab } from '../../context/ConnectionContext';

export const WorkspaceTabBar: React.FC = () => {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    selectedDb,
    selectedCollection,
    openTab
  } = useConnection();

  const handleOpenCurrentTab = () => {
    if (selectedCollection && selectedDb) {
      openTab(selectedDb, selectedCollection);
    }
  };

  return (
    <div className="db-tab-bar">
      {tabs.map((tab: CollectionTab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`db-tab-item ${isActive ? 'active' : ''}`}
          >
            <Table className={`db-icon-sm ${isActive ? 'db-icon-emerald' : 'db-icon-muted'}`} />
            <span className="db-truncate-sm">{tab.collectionName}</span>
            {tab.dbName && (
              <span className="db-text-micro">({tab.dbName})</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="db-btn db-btn-secondary p-0.5"
              title="Close Tab"
            >
              <X className="db-icon-xs" />
            </button>
          </div>
        );
      })}

      {selectedCollection && selectedDb && !tabs.some((t: CollectionTab) => t.collectionName === selectedCollection) && (
        <button
          onClick={handleOpenCurrentTab}
          className="db-btn db-btn-secondary py-1 px-2 db-text-xs"
          title="Open Current Collection in New Tab"
        >
          <Plus className="db-icon-xs" />
          <span>New Tab</span>
        </button>
      )}
    </div>
  );
};
