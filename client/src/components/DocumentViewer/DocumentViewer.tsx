import React, { useState, useMemo } from 'react';
import { Table as TableIcon, Network, Code2, Plus, Download, ChevronLeft, ChevronRight, Edit2, Trash2, ShieldAlert, FileSpreadsheet, RefreshCw, LayoutGrid, Copy, Check, Eye, Search, Layers, HardDrive, Clock, CheckSquare, Square, Sparkles, BarChart3, X } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { TreeNode } from './TreeView';
import { useConnection } from '../../context/ConnectionContext';

interface DocumentViewerProps {
  documents: any[];
  totalCount: number;
  loading: boolean;
  executionTimeMs: number | null;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onRefresh: () => void;
  onOpenEditModal: (doc: any) => void;
  onOpenCreateModal: () => void;
  onDeleteDoc: (doc: any) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  totalCount,
  loading,
  executionTimeMs,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onRefresh,
  onOpenEditModal,
  onOpenCreateModal,
  onDeleteDoc
}) => {
  const { readOnlyMode, selectedCollection, collections, theme } = useConnection();
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'tree' | 'raw'>('table');
  const [selectedCellDoc, setSelectedCellDoc] = useState<any | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const currentCollStats = collections.find(c => c.name === selectedCollection);

  const filteredDocuments = useMemo(() => {
    if (!clientSearch.trim()) return documents;
    const term = clientSearch.toLowerCase();
    return documents.filter(doc =>
      JSON.stringify(doc).toLowerCase().includes(term)
    );
  }, [documents, clientSearch]);

  const columns = Array.from(
    new Set(filteredDocuments.flatMap(doc => Object.keys(doc)))
  );

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handleToggleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      const allIds = new Set<string>();
      filteredDocuments.forEach((d, idx) => allIds.add(d._id?.$oid || d._id || String(idx)));
      setSelectedDocIds(allIds);
    }
  };

  const handleToggleSelectRow = (idStr: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  const handleExportJSON = () => {
    const exportData = selectedDocIds.size > 0
      ? filteredDocuments.filter((d, idx) => selectedDocIds.has(d._id?.$oid || d._id || String(idx)))
      : filteredDocuments;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `documents_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const exportData = selectedDocIds.size > 0
      ? filteredDocuments.filter((d, idx) => selectedDocIds.has(d._id?.$oid || d._id || String(idx)))
      : filteredDocuments;

    if (exportData.length === 0) return;
    const headers = columns.join(',');
    const rows = exportData.map(doc =>
      columns.map(col => {
        const val = doc[col];
        if (val === undefined || val === null) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvStr);
    downloadAnchor.setAttribute('download', `documents_export_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyDoc = (doc: any, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const getColumnTypeIcon = (colName: string) => {
    if (colName === '_id') return <span className="db-badge db-badge-purple">🔑</span>;
    if (colName.toLowerCase().includes('date') || colName.toLowerCase().includes('at')) return <span className="db-badge db-badge-amber">🗓️</span>;
    if (colName.toLowerCase().includes('count') || colName.toLowerCase().includes('size') || colName.toLowerCase().includes('price') || colName.toLowerCase().includes('total')) return <span className="db-badge db-badge-cyan">#</span>;
    return <span className="db-badge db-badge-green">Aa</span>;
  };

  const renderCellValue = (val: any) => {
    if (val === undefined || val === null) return <span className="text-slate-600 italic">null</span>;
    if (typeof val === 'object') {
      if (val.$oid) return <span className="text-purple-400 db-mono">ObjectId("{val.$oid.substring(0, 8)}...")</span>;
      if (val.$date) return <span className="text-amber-400 db-mono">{new Date(val.$date).toLocaleDateString()}</span>;
      return <span className="text-cyan-300/80 db-mono truncate max-w-[160px] inline-block">{JSON.stringify(val)}</span>;
    }
    if (typeof val === 'boolean') return <span className="text-pink-400 db-mono font-medium">{val ? 'true' : 'false'}</span>;
    if (typeof val === 'number') return <span className="text-cyan-400 db-mono font-medium">{val.toLocaleString()}</span>;
    return <span className="truncate max-w-[220px] inline-block">{String(val)}</span>;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--bg-dark)]">
      {/* Top Metric Stat Cards Bar (Collapsible - Saves 85px of vertical space!) */}
      {selectedCollection && showDetailedStats && (
        <div className="db-metrics-grid animate-fade-in">
          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Total Documents</span>
              <span className="db-stat-value text-emerald-400">
                {(currentCollStats?.count || totalCount).toLocaleString()}
              </span>
            </div>
            <TableIcon className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Query Execution</span>
              <span className="db-stat-value text-cyan-400">
                {executionTimeMs !== null ? `${executionTimeMs} ms` : '0 ms'}
              </span>
            </div>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Storage Size</span>
              <span className="db-stat-value text-purple-400">
                {formatSize(currentCollStats?.size || 0)}
              </span>
            </div>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>

          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Indexes Active</span>
              <span className="db-stat-value text-amber-400">
                {currentCollStats?.indexesCount || 1} Indexes
              </span>
            </div>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      )}

      {/* Toolbar Controls Bar - Unified & Highly Responsive */}
      <div className="db-toolbar py-1 px-3">
        {/* Left: View Switcher, Stats toggle & Quick client search */}
        <div className="db-row-start gap-2 flex-wrap">
          <div className="db-pill-switcher">
            <button
              onClick={() => setViewMode('table')}
              className={`db-pill-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table Grid View"
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" /> <span className="hidden sm:inline">Table</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`db-pill-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" /> <span className="hidden sm:inline">Cards</span>
            </button>

            <button
              onClick={() => setViewMode('tree')}
              className={`db-pill-btn ${viewMode === 'tree' ? 'active' : ''}`}
              title="Tree View"
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" /> <span className="hidden sm:inline">Tree</span>
            </button>

            <button
              onClick={() => setViewMode('raw')}
              className={`db-pill-btn ${viewMode === 'raw' ? 'active' : ''}`}
              title="Monaco Raw JSON"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" /> <span className="hidden sm:inline">JSON</span>
            </button>
          </div>

          {/* Detailed Stats Toggle Button */}
          {selectedCollection && (
            <button
              onClick={() => setShowDetailedStats(!showDetailedStats)}
              className={`db-btn db-text-xs py-1 px-2 ${showDetailedStats ? 'db-btn-primary' : 'db-btn-secondary'}`}
              title="Toggle Detailed Metrics Cards (Storage, Latency, Indexes)"
            >
              <BarChart3 className="w-3 h-3" />
              <span className="hidden md:inline">Stats</span>
            </button>
          )}

          {/* Inline Summary Badges when stats are collapsed */}
          {!showDetailedStats && selectedCollection && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent-emerald)] font-bold">
                {totalCount.toLocaleString()} docs
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                {formatSize(currentCollStats?.size || 0)}
              </span>
            </div>
          )}

          {/* Quick In-Page Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute right-2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search in page..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="db-input pl-7 pr-6 py-1 text-xs w-28 sm:w-40"
            />
            {clientSearch && (
              <button
                onClick={() => setClientSearch('')}
                className="absolute right-1.5 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={onRefresh}
            className="db-icon-btn p-1.5"
            title="Reload Documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin db-icon-emerald' : ''}`} />
          </button>
        </div>

        {/* Right Actions */}
        <div className="db-row-end gap-1.5 flex-wrap">
          {selectedDocIds.size > 0 && (
            <span className="db-badge db-badge-cyan text-xs">
              {selectedDocIds.size} selected
            </span>
          )}

          <button onClick={handleExportJSON} className="db-btn db-btn-secondary db-text-xs py-1 px-2" title="Export as JSON">
            <Code2 className="db-icon-xs db-icon-purple" />
            <span className="hidden md:inline">Export JSON</span>
          </button>

          <button onClick={handleExportCSV} className="db-btn db-btn-secondary db-text-xs py-1 px-2" title="Export as CSV">
            <FileSpreadsheet className="db-icon-xs db-icon-emerald" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            disabled={readOnlyMode}
            className={`db-btn db-text-xs py-1 px-2.5 ${readOnlyMode ? 'db-btn-secondary opacity-50' : 'db-btn-primary'}`}
            title="Insert new document"
          >
            <Plus className="db-icon-xs" />
            <span className="font-semibold">New Document</span>
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-auto p-2">
        {loading ? (
          <div className="db-full-h db-flex db-items-center db-justify-center db-text-xs db-text-muted">
            <RefreshCw className="db-icon-sm animate-spin db-icon-emerald" />
            <span>Loading documents from MongoDB...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="db-full-h db-flex db-items-center db-justify-center db-text-xs db-text-muted">
            No documents matched your filter.
          </div>
        ) : viewMode === 'table' ? (
          /* Custom Table View */
          <div className="db-table-wrapper h-full overflow-auto">
            <table className="db-table">
              <thead>
                <tr>
                  <th className="db-text-center w-10">
                    <button onClick={handleToggleSelectAll} className="db-btn-ghost">
                      {selectedDocIds.size === filteredDocuments.length ? <CheckSquare className="db-icon-xs db-icon-emerald" /> : <Square className="db-icon-xs" />}
                    </button>
                  </th>
                  <th className="db-text-center w-24">Actions</th>
                  {columns.map(col => (
                    <th key={col}>
                      <div className="db-row-start gap-1">
                        {getColumnTypeIcon(col)}
                        <span>{col}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc, idx) => {
                  const idStr = doc._id?.$oid || doc._id || String(idx);
                  const isSelected = selectedDocIds.has(idStr);

                  return (
                    <tr
                      key={idx}
                      className={isSelected ? 'active-emerald' : ''}
                      onDoubleClick={() => !readOnlyMode && onOpenEditModal(doc)}
                      title="Double-click to edit document"
                    >
                      <td className="db-text-center">
                        <button onClick={() => handleToggleSelectRow(idStr)} className="db-btn-ghost">
                          {isSelected ? <CheckSquare className="db-icon-xs db-icon-emerald" /> : <Square className="db-icon-xs" />}
                        </button>
                      </td>
                      <td className="text-center">
                        <div className="db-row-start justify-center gap-1">
                          <button onClick={() => setSelectedCellDoc(doc)} className="db-icon-btn-cyan p-1" title="Inspect Document">
                            <Eye className="db-icon-xs" />
                          </button>
                          <button onClick={() => onOpenEditModal(doc)} disabled={readOnlyMode} className="db-icon-btn-emerald p-1" title="Edit Document">
                            <Edit2 className="db-icon-xs" />
                          </button>
                          <button onClick={() => onDeleteDoc(doc)} disabled={readOnlyMode} className="db-icon-btn-danger p-1" title="Delete Document">
                            <Trash2 className="db-icon-xs" />
                          </button>
                        </div>
                      </td>
                      {columns.map(col => (
                        <td key={col}>{renderCellValue(doc[col])}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="db-card-grid">
            {filteredDocuments.map((doc, idx) => (
              <div key={idx} className="db-doc-card">
                <div className="db-row-start db-justify-between db-border-b db-py-1">
                  <span className="db-font-mono db-text-xs db-font-semibold db-text-emerald">
                    Doc #{idx + 1 + (page - 1) * limit}
                  </span>
                  <div className="db-row-end">
                    <button onClick={() => handleCopyDoc(doc, idx)} className="db-icon-btn" title="Copy Document JSON">
                      {copiedIndex === idx ? <Check className="db-icon-xs db-icon-emerald" /> : <Copy className="db-icon-xs" />}
                    </button>
                    <button onClick={() => onOpenEditModal(doc)} disabled={readOnlyMode} className="db-icon-btn-emerald" title="Edit Document">
                      <Edit2 className="db-icon-xs" />
                    </button>
                    <button onClick={() => onDeleteDoc(doc)} disabled={readOnlyMode} className="db-icon-btn-danger" title="Delete Document">
                      <Trash2 className="db-icon-xs" />
                    </button>
                  </div>
                </div>

                <div className="db-space-y-1 db-font-mono db-text-xs">
                  {Object.keys(doc).slice(0, 5).map(key => (
                    <div key={key} className="db-row-start db-justify-between">
                      <span className="db-text-muted db-truncate">{key}:</span>
                      <span className="db-text-primary db-truncate">{renderCellValue(doc[key])}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedCellDoc(doc)}
                  className="db-btn db-btn-secondary db-text-xs db-full-w"
                >
                  Inspect Full Object
                </button>
              </div>
            ))}
          </div>
        ) : viewMode === 'tree' ? (
          /* Tree View */
          <div className="db-space-y-3 db-tree-container">
            {filteredDocuments.map((doc, idx) => (
              <div key={idx} className="db-card-box">
                <div className="db-row-start db-justify-between db-border-b db-py-1">
                  <span className="db-font-mono db-text-xs db-text-primary db-font-bold">Doc #{idx + 1 + (page - 1) * limit}</span>
                  <div className="db-row-end">
                    <button onClick={() => onOpenEditModal(doc)} disabled={readOnlyMode} className="db-icon-btn-emerald" title="Edit Document">
                      <Edit2 className="db-icon-xs" />
                    </button>
                    <button onClick={() => onDeleteDoc(doc)} disabled={readOnlyMode} className="db-icon-btn-danger" title="Delete Document">
                      <Trash2 className="db-icon-xs" />
                    </button>
                  </div>
                </div>
                <TreeNode label="doc" value={doc} path={`doc_${idx}`} />
              </div>
            ))}
          </div>
        ) : (
          /* Monaco Raw JSON View */
          <div className="db-editor-container">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme={theme === 'theme-light' ? 'light' : 'vs-dark'}
              value={JSON.stringify(filteredDocuments, null, 2)}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'Fira Code, monospace',
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                folding: true,
                lineHeight: 22,
                padding: { top: 10, bottom: 10 }
              }}
            />
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="db-footer-pagination py-1.5 px-3">
        <div>
          Showing {filteredDocuments.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalCount)} of <strong>{totalCount}</strong> docs
        </div>

        <div className="db-row-end">
          <div className="db-row-start">
            <span className="db-text-xs">Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="db-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="db-row-start">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="db-btn db-btn-secondary db-p-1" title="Previous Page">
              <ChevronLeft className="db-icon-sm" />
            </button>
            <span className="db-px-2">Page {page} of {totalPages}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="db-btn db-btn-secondary db-p-1" title="Next Page">
              <ChevronRight className="db-icon-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Cell Inspect Modal */}
      {selectedCellDoc && (
        <div className="db-modal-overlay">
          <div className="db-modal-box db-modal-lg db-modal-editor-box">
            <div className="db-modal-header">
              <div className="db-row-start">
                <Code2 className="db-icon-sm db-icon-cyan" />
                <span className="db-font-bold db-text-xs db-text-primary">Inspect Document JSON</span>
              </div>
              <div className="db-row-end">
                <button
                  onClick={() => {
                    const docToEdit = selectedCellDoc;
                    setSelectedCellDoc(null);
                    onOpenEditModal(docToEdit);
                  }}
                  disabled={readOnlyMode}
                  className="db-btn db-btn-primary db-text-xs"
                  title="Edit Document"
                >
                  <Edit2 className="db-icon-xs" />
                  <span>Edit Document</span>
                </button>
                <button onClick={() => setSelectedCellDoc(null)} className="db-btn db-btn-secondary db-p-1" title="Close">✕</button>
              </div>
            </div>
            <div className="flex-1 min-h-[380px] relative p-2 border-y border-[var(--border-color)] bg-[var(--bg-card)]">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === 'theme-light' ? 'light' : 'vs-dark'}
                value={JSON.stringify(selectedCellDoc, null, 2)}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'Fira Code, monospace',
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  folding: true,
                  lineHeight: 22,
                  padding: { top: 10, bottom: 10 }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
