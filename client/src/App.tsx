import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
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
import { ConfirmDestructionModal } from './components/Common/ConfirmDestructionModal';
import { ExportModal } from './components/Export/ExportModal';
import { ImportWizardModal } from './components/Import/ImportWizardModal';
import { useConnection } from './context/ConnectionContext';
import { Layers, Database as DatabaseIcon, ShieldAlert, Bookmark, Command, Activity, FolderPlus } from 'lucide-react';
import axios from 'axios';

interface AppContentProps {
  initialMode?: 'explorer' | 'aggregation';
}

export const AppContent: React.FC<AppContentProps> = ({ initialMode }) => {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState?.location?.pathname || (initialMode === 'aggregation' ? '/aggregation' : '/');
  const mainMode: 'explorer' | 'aggregation' = currentPath === '/aggregation' ? 'aggregation' : 'explorer';

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

  // Export, Import & Destructive Confirmation Safeguard Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedDocsForExport, setSelectedDocsForExport] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any | null>(null);
  const [bulkDocsToDelete, setBulkDocsToDelete] = useState<any[] | null>(null);

  // Query & Document Explorer State
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [schemaFields, setSchemaFields] = useState<string[]>([]);

  const getSavedQuery = (db: string | null, coll: string | null) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !db || !coll) {
      return { filter: {}, projection: {}, sort: {} };
    }
    try {
      const saved = localStorage.getItem(`db_query_${db}_${coll}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { filter: {}, projection: {}, sort: {} };
  };

  const [activeQuery, setActiveQuery] = useState<{ filter: any; projection?: any; sort?: any }>({
    filter: {},
    projection: {},
    sort: {}
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedDb = localStorage.getItem('db_explorer_active_db');
      const savedColl = localStorage.getItem('db_explorer_active_coll');
      if (savedDb && savedColl) {
        const query = getSavedQuery(savedDb, savedColl);
        setActiveQuery(query);
      }
    }
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const prevCollRef = React.useRef<string | null>(selectedCollection);
  useEffect(() => {
    if (prevCollRef.current !== selectedCollection) {
      prevCollRef.current = selectedCollection;
      setPage(1);
      const query = getSavedQuery(selectedDb, selectedCollection);
      setActiveQuery(query);
    }
  }, [selectedDb, selectedCollection]);

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
        setQueryError(null);
      }
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      const errMsg = err.response?.data?.error || err.message || 'Error executing query';
      setQueryError(errMsg);
      setDocuments([]);
      setTotalCount(0);
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
    setQueryError(null);
    setActiveQuery(queryObj);
    addQueryHistory(queryObj);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && selectedDb && selectedCollection) {
      try {
        const hasContent = (queryObj.filter && Object.keys(queryObj.filter).length > 0) ||
                           (queryObj.sort && Object.keys(queryObj.sort).length > 0) ||
                           (queryObj.projection && Object.keys(queryObj.projection).length > 0);
        if (hasContent) {
          localStorage.setItem(`db_query_${selectedDb}_${selectedCollection}`, JSON.stringify(queryObj));
        } else {
          localStorage.removeItem(`db_query_${selectedDb}_${selectedCollection}`);
        }
      } catch {}
    }
  };

  const handleApplyAiQuery = (aiResult: any) => {
    if (aiResult.type === 'aggregate' && aiResult.pipeline) {
      navigate({ to: '/aggregation' });
    } else {
      navigate({ to: '/' });
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
      navigate({ to: '/aggregation' });
    } else if (action.type === 'mode-explorer') {
      navigate({ to: '/' });
    }
  };

  const handleDeleteDoc = (doc: any) => {
    if (readOnlyMode) return;
    setBulkDocsToDelete(null);
    setDocToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDelete = (docs: any[]) => {
    if (readOnlyMode || docs.length === 0) return;
    setDocToDelete(null);
    setBulkDocsToDelete(docs);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (bulkDocsToDelete && bulkDocsToDelete.length > 0) {
        const ids = bulkDocsToDelete.map(d => d._id?.$oid ? { $oid: d._id.$oid } : d._id);
        const res = await axios.delete(
          `/api/documents/${selectedDb}/${selectedCollection}/delete`,
          {
            data: { filter: { _id: { $in: ids } }, isMany: true },
            headers: {
              'x-mongo-uri': activeProfile?.uri,
              'x-readonly': readOnlyMode ? 'true' : 'false'
            }
          }
        );
        if (res.data.success) {
          fetchDocuments();
        }
        setBulkDocsToDelete(null);
      } else if (docToDelete) {
        const filter = docToDelete._id ? { _id: docToDelete._id } : { ...docToDelete };
        const res = await axios.delete(
          `/api/documents/${selectedDb}/${selectedCollection}/delete`,
          {
            data: { filter },
            headers: {
              'x-mongo-uri': activeProfile?.uri,
              'x-readonly': readOnlyMode ? 'true' : 'false'
            }
          }
        );
        if (res.data.success) {
          fetchDocuments();
        }
        setDocToDelete(null);
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
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
          {/* Multi-Tab Workspace Bar (inside content area) */}
          <WorkspaceTabBar />

          {/* Sub-Header Mode Switcher & Quick Command Bar */}
          <div className="db-sub-header">
            <div className="db-row-start">
              <Link
                to="/"
                className={`db-sub-header-btn ${
                  mainMode === 'explorer' ? 'active-emerald' : ''
                }`}
              >
                <DatabaseIcon className="db-icon-sm db-icon-emerald" /> Document Explorer
              </Link>

              <Link
                to="/aggregation"
                className={`db-sub-header-btn ${
                  mainMode === 'aggregation' ? 'active-purple' : ''
                }`}
              >
                <Layers className="db-icon-sm db-icon-purple" /> Aggregation Pipeline
              </Link>
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
                activeQuery={activeQuery}
              />

              {/* Document Viewer */}
              <DocumentViewer
                documents={documents}
                totalCount={totalCount}
                loading={loading}
                executionTimeMs={executionTimeMs}
                queryError={queryError}
                onClearQueryError={() => {
                  setQueryError(null);
                  handleExecuteQuery({ filter: {}, projection: {}, sort: {} });
                }}
                page={page}
                limit={limit}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
                onRefresh={fetchDocuments}
                onOpenEditModal={(doc) => { setSelectedDocToEdit(doc); setIsDocModalOpen(true); }}
                onOpenCreateModal={() => { setSelectedDocToEdit(null); setIsDocModalOpen(true); }}
                onDeleteDoc={handleDeleteDoc}
                onBulkDeleteDocs={handleBulkDelete}
                onOpenExportModal={(selectedDocs) => {
                  setSelectedDocsForExport(selectedDocs);
                  setIsExportModalOpen(true);
                }}
                onOpenImportModal={() => setIsImportModalOpen(true)}
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

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        documents={documents}
        selectedDocuments={selectedDocsForExport}
        totalCount={totalCount}
        columns={Array.from(new Set(documents.flatMap(d => Object.keys(d))))}
      />

      <ImportWizardModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchDocuments();
          refreshCollections();
        }}
      />

      <ConfirmDestructionModal
        isOpen={isDeleteModalOpen}
        title={bulkDocsToDelete ? `Delete ${bulkDocsToDelete.length} Documents` : "Delete Document"}
        message={bulkDocsToDelete
          ? `Are you sure you want to permanently delete these ${bulkDocsToDelete.length} selected documents from collection "${selectedCollection}"? This operation cannot be reversed.`
          : `Are you sure you want to permanently delete this document from collection "${selectedCollection}"? This operation cannot be reversed.`
        }
        confirmTargetName="delete"
        confirmButtonText={bulkDocsToDelete ? `Delete ${bulkDocsToDelete.length} Documents` : "Permanently Delete Document"}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDocToDelete(null);
          setBulkDocsToDelete(null);
        }}
      />

      <SchemaInspectorModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        dbName={selectedDb}
        collectionName={selectedCollection}
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
        onClose={() => {
          setIsDocModalOpen(false);
          setSelectedDocToEdit(null);
        }}
        onSuccess={fetchDocuments}
        initialDocument={selectedDocToEdit}
      />

      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onApplyQuery={handleApplyAiQuery}
        schemaFields={schemaFields}
        collectionName={selectedCollection || ''}
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
