import React, { useState, useEffect } from 'react';
import { Header } from './components/Header/Header';
import { WorkspaceTabBar } from './components/Header/WorkspaceTabBar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ConnectionModal } from './components/Connection/ConnectionModal';
import { DocumentViewer } from './components/DocumentViewer/DocumentViewer';
import { DocumentModal } from './components/DocumentViewer/DocumentModal';
import { QueryBuilder } from './components/QueryBuilder/QueryBuilder';
import { AggregationBuilder } from './components/Aggregation/AggregationBuilder';
import { SchemaInspectorModal } from './components/Schema/SchemaInspectorModal';
import { CreateCollectionModal } from './components/Schema/CreateCollectionModal';
import { ExplainPlanModal } from './components/Performance/ExplainPlanModal';
import { ServerStatusModal } from './components/Performance/ServerStatusModal';
import { AIAssistantDrawer } from './components/AIAssistant/AIAssistantDrawer';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { QueryHistoryDrawer } from './components/QueryBuilder/QueryHistoryDrawer';
import { useConnection } from './context/ConnectionContext';
import { Layers, Database as DatabaseIcon, ShieldAlert, Bookmark, Command, Activity, FolderPlus } from 'lucide-react';
import axios from 'axios';

export const AppContent: React.FC = () => {
  const {
    activeProfile,
    selectedDb,
    selectedCollection,
    isConnected,
    readOnlyMode,
    addQueryHistory,
    selectDatabase,
    refreshCollections
  } = useConnection();

  // Navigation mode: 'explorer' | 'aggregation'
  const [mainMode, setMainMode] = useState<'explorer' | 'aggregation'>('explorer');

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals & Drawers state
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isCreateCollModalOpen, setIsCreateCollModalOpen] = useState(false);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [isServerStatusModalOpen, setIsServerStatusModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedDocToEdit, setSelectedDocToEdit] = useState<any | null>(null);

  // Query & Document Explorer State
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [schemaFields, setSchemaFields] = useState<string[]>([]);

  const [activeQuery, setActiveQuery] = useState<{ filter: any; projection?: any; sort?: any }>({
    filter: {},
    projection: {},
    sort: {}
  });

  // Fetch documents whenever selected collection, page, limit, or query changes
  useEffect(() => {
    if (isConnected && selectedDb && selectedCollection) {
      fetchDocuments();
      fetchSchemaFields();
    } else {
      setDocuments([]);
      setTotalCount(0);
    }
  }, [isConnected, selectedDb, selectedCollection, page, limit, activeQuery]);

  const fetchDocuments = async () => {
    if (!activeProfile || !selectedDb || !selectedCollection) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/documents/${selectedDb}/${selectedCollection}/query`,
        {
          filter: activeQuery.filter,
          projection: activeQuery.projection,
          sort: activeQuery.sort,
          limit,
          skip: (page - 1) * limit
        },
        { headers: { 'x-mongo-uri': activeProfile.uri } }
      );

      if (res.data.success) {
        setDocuments(res.data.documents || []);
        setTotalCount(res.data.totalCount || 0);
        setExecutionTimeMs(res.data.executionTimeMs);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemaFields = async () => {
    if (!activeProfile || !selectedDb || !selectedCollection) return;
    try {
      const res = await axios.get(`/api/schema/${selectedDb}/${selectedCollection}/infer`, {
        headers: { 'x-mongo-uri': activeProfile.uri }
      });
      if (res.data.success && res.data.fields) {
        setSchemaFields(res.data.fields.map((f: any) => f.name));
      }
    } catch {}
  };

  const handleExecuteQuery = (queryObj: { filter: any; projection?: any; sort?: any }) => {
    setPage(1);
    setActiveQuery(queryObj);
    addQueryHistory(queryObj);
  };

  const handleApplyAiQuery = (aiResult: any) => {
    if (aiResult.type === 'aggregate' && aiResult.pipeline) {
      setMainMode('aggregation');
    } else {
      setMainMode('explorer');
      handleExecuteQuery({
        filter: aiResult.filter || {},
        projection: aiResult.projection || {},
        sort: aiResult.sort || {}
      });
    }
  };

  const handleSelectCommandPaletteAction = (action: { type: string; payload?: any }) => {
    if (action.type === 'switch-db' && action.payload) {
      selectDatabase(action.payload);
    } else if (action.type === 'open-ai') {
      setIsAiDrawerOpen(true);
    } else if (action.type === 'mode-aggregation') {
      setMainMode('aggregation');
    }
  };

  const handleDeleteDoc = async (doc: any) => {
    if (readOnlyMode) {
      alert('Read-Only Safety Guard is active! Writes and deletes are disabled.');
      return;
    }

    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const filter = doc._id ? { _id: doc._id } : { ...doc };
      const res = await axios.delete(
        `/api/documents/${selectedDb}/${selectedCollection}/delete`,
        {
          data: { filter },
          headers: { 'x-mongo-uri': activeProfile?.uri }
        }
      );
      if (res.data.success) {
        fetchDocuments();
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="app-container db-flex-col">
      {/* Top Header */}
      <Header
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Multi-Tab Workspace Bar */}
      <WorkspaceTabBar />

      {/* Main Body Layout */}
      <div className="db-main-body">
        {/* Left Sidebar */}
        <Sidebar
          onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Pane */}
        <main className="db-content-pane">
          {/* Sub-Header Mode Switcher & Quick Command Bar */}
          <div className="db-sub-header">
            <div className="db-row-start">
              <button
                onClick={() => setMainMode('explorer')}
                className={`db-sub-header-btn ${
                  mainMode === 'explorer' ? 'active-emerald' : ''
                }`}
              >
                <DatabaseIcon className="db-icon-sm db-icon-emerald" /> Document Explorer
              </button>

              <button
                onClick={() => setMainMode('aggregation')}
                className={`db-sub-header-btn ${
                  mainMode === 'aggregation' ? 'active-purple' : ''
                }`}
              >
                <Layers className="db-icon-sm db-icon-purple" /> Aggregation Pipeline
              </button>
            </div>

            <div className="db-row-end">
              {selectedDb && (
                <button
                  onClick={() => setIsCreateCollModalOpen(true)}
                  className="db-action-btn-emerald"
                  title="Create New Collection"
                >
                  <FolderPlus className="db-icon-sm" />
                  <span className="hidden md:inline">New Collection</span>
                </button>
              )}

              {selectedCollection && (
                <button
                  onClick={() => setIsExplainModalOpen(true)}
                  className="db-action-btn-cyan"
                  title="Explain Query Execution Plan"
                >
                  <Activity className="db-icon-sm" />
                  <span className="hidden md:inline">Explain Query</span>
                </button>
              )}

              {isConnected && (
                <button
                  onClick={() => setIsServerStatusModalOpen(true)}
                  className="db-action-btn-purple"
                  title="Live MongoDB Cluster Health & Server Diagnostics"
                >
                  <Activity className="db-icon-sm" />
                  <span className="hidden md:inline">Server Diagnostics</span>
                </button>
              )}

              <button
                onClick={() => setIsHistoryDrawerOpen(true)}
                className="db-action-btn-amber"
                title="Saved Queries & Execution History"
              >
                <Bookmark className="db-icon-sm db-icon-amber" />
                <span className="hidden lg:inline">Snippets & History</span>
              </button>

              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="db-action-btn-command"
              >
                <Command className="db-icon-xs db-icon-emerald" /> Ctrl + K
              </button>

              {readOnlyMode && (
                <span className="db-badge db-badge-amber">
                  <ShieldAlert className="db-icon-xs db-icon-amber" /> Read-Only
                </span>
              )}
            </div>
          </div>

          {/* Mode Render */}
          {mainMode === 'explorer' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Query Builder */}
              <QueryBuilder
                onExecuteQuery={handleExecuteQuery}
                schemaFields={schemaFields}
                executionTimeMs={executionTimeMs}
                loading={loading}
              />

              {/* Document Viewer */}
              <DocumentViewer
                documents={documents}
                totalCount={totalCount}
                loading={loading}
                executionTimeMs={executionTimeMs}
                page={page}
                limit={limit}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
                onRefresh={fetchDocuments}
                onOpenEditModal={(doc) => { setSelectedDocToEdit(doc); setIsDocModalOpen(true); }}
                onOpenCreateModal={() => { setSelectedDocToEdit(null); setIsDocModalOpen(true); }}
                onDeleteDoc={handleDeleteDoc}
              />
            </div>
          ) : (
            <AggregationBuilder />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
      />

      <SchemaInspectorModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <CreateCollectionModal
        isOpen={isCreateCollModalOpen}
        onClose={() => setIsCreateCollModalOpen(false)}
        onSuccess={refreshCollections}
      />

      <ExplainPlanModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        queryFilter={activeQuery.filter}
      />

      <ServerStatusModal
        isOpen={isServerStatusModalOpen}
        onClose={() => setIsServerStatusModalOpen(false)}
      />

      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSuccess={fetchDocuments}
        initialDocument={selectedDocToEdit}
      />

      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onApplyQuery={handleApplyAiQuery}
        schemaFields={schemaFields}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleSelectCommandPaletteAction}
      />

      <QueryHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onApplyQuery={(q) => handleExecuteQuery(q)}
        currentQueryToSave={activeQuery}
      />
    </div>
  );
};
