import React, { useState } from 'react';
import { Database, Folder, Table, Search, HardDrive, Layers, RefreshCw, Server, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';

interface SidebarProps {
  onOpenConnectionModal: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenConnectionModal,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const {
    databases,
    collections,
    selectedDb,
    selectedCollection,
    selectDatabase,
    selectCollection,
    loadingDbs,
    loadingCollections,
    refreshDatabases,
    refreshCollections,
    isConnected
  } = useConnection();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const sidebarContent = (
    <div className="db-flex db-flex-col db-flex-1 db-nowrap">
      {/* Database Selector Section */}
      <div className="db-sidebar-header">
        <div className="db-row-start db-justify-between">
          <label className="db-text-xs db-font-bold db-text-muted db-row-start">
            <Server className="db-icon-sm db-icon-emerald" /> Databases ({databases.length})
          </label>
          <div className="db-row-end">
            <button
              onClick={refreshDatabases}
              className="db-btn db-btn-secondary"
              title="Refresh Databases"
            >
              <RefreshCw className={`db-icon-sm ${loadingDbs ? 'animate-spin db-icon-emerald' : ''}`} />
            </button>
            {onCloseMobile ? (
              <button onClick={onCloseMobile} className="db-btn db-btn-secondary">
                <X className="db-icon" />
              </button>
            ) : (
              <button onClick={onToggleCollapse} className="db-btn db-btn-secondary">
                <ChevronLeft className="db-icon" />
              </button>
            )}
          </div>
        </div>

        {isConnected ? (
          <select
            value={selectedDb || ''}
            onChange={(e) => {
              selectDatabase(e.target.value);
              if (onCloseMobile) onCloseMobile();
            }}
            className="db-input db-text-sm db-font-semibold db-text-emerald db-full-w"
          >
            {databases.map(db => (
              <option key={db.name} value={db.name}>
                {db.name} ({db.collectionsCount} colls)
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={() => {
              onOpenConnectionModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="db-btn db-btn-primary db-full-w db-text-xs"
          >
            <span>Connect Mongo Database</span>
            <Plus className="db-icon" />
          </button>
        )}
      </div>

      {/* Collection Search */}
      <div className="p-2 border-b border-slate-800">
        <div className="relative">
          <Search className="db-icon-sm db-icon-muted absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="db-input pl-8 db-text-xs db-full-w"
          />
        </div>
      </div>

      {/* Collections List */}
      <div className="db-flex-1 overflow-y-auto p-2 space-y-1">
        <div className="db-row-start db-justify-between db-text-xs db-font-bold db-text-muted">
          <span className="db-row-start">
            <Folder className="db-icon-sm db-icon-cyan" /> Collections ({filteredCollections.length})
          </span>
          {loadingCollections && (
            <RefreshCw className="db-icon-sm animate-spin db-icon-cyan" />
          )}
        </div>

        {!isConnected && (
          <div className="p-6 text-center db-text-xs db-text-muted">
            No active database connection.
          </div>
        )}

        {filteredCollections.map(coll => {
          const isSelected = selectedCollection === coll.name;
          return (
            <button
              key={coll.name}
              onClick={() => {
                selectCollection(coll.name);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`db-collection-item ${isSelected ? 'active' : ''}`}
            >
              <div className="db-row-start db-truncate-sm">
                <Table className={`db-icon-sm ${isSelected ? 'db-icon-emerald' : 'db-icon-muted'}`} />
                <span className="db-truncate-sm">{coll.name}</span>
              </div>

              <span className="db-badge db-badge-green db-font-mono db-text-xs">
                {coll.count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Database Footer Stats */}
      {selectedDb && (
        <div className="p-3 border-t border-slate-800 bg-slate-950 db-text-xs db-text-muted space-y-1.5">
          <div className="db-row-start db-justify-between">
            <span className="db-row-start db-text-secondary">
              <HardDrive className="db-icon-sm db-icon-muted" /> Storage:
            </span>
            <span className="db-font-mono db-font-semibold db-text-primary">
              {formatSize(databases.find(d => d.name === selectedDb)?.dataSize || 0)}
            </span>
          </div>
          <div className="db-row-start db-justify-between">
            <span className="db-row-start db-text-secondary">
              <Layers className="db-icon-sm db-icon-muted" /> Total Objects:
            </span>
            <span className="db-font-mono db-font-semibold db-text-primary">
              {(databases.find(d => d.name === selectedDb)?.objectsCount || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 z-50 animate-fade-in shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className={`db-sidebar hidden lg:flex ${collapsed ? 'collapsed' : ''}`}>
        {collapsed ? (
          <div className="db-flex db-flex-col db-items-center db-gap-4 db-full-w py-3">
            <button onClick={onToggleCollapse} className="db-btn db-btn-secondary p-2">
              <ChevronRight className="db-icon db-icon-emerald" />
            </button>

            <div className="h-[1px] w-8 bg-slate-800" />

            <button onClick={onOpenConnectionModal} className="db-btn db-btn-secondary p-2.5">
              <Server className="db-icon db-icon-emerald" />
            </button>

            {isConnected && (
              <div className="db-flex db-flex-col db-items-center db-gap-2 overflow-y-auto db-full-w px-1">
                {filteredCollections.map(c => (
                  <button
                    key={c.name}
                    onClick={() => selectCollection(c.name)}
                    className={`p-2 rounded-lg db-text-xs db-font-mono transition ${
                      selectedCollection === c.name ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                    title={`${c.name} (${c.count} docs)`}
                  >
                    <Table className="db-icon" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          sidebarContent
        )}
      </aside>
    </>
  );
};
