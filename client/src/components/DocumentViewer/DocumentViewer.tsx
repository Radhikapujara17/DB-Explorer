import React, { useState, useMemo } from 'react';
import { Table as TableIcon, Network, Code2, Plus, Download, ChevronLeft, ChevronRight, Edit2, Trash2, ShieldAlert, FileSpreadsheet, RefreshCw, LayoutGrid, Copy, Check, Eye, Search, Layers, HardDrive, Clock, CheckSquare, Square, Sparkles } from 'lucide-react';
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
  const { readOnlyMode, selectedCollection, collections } = useConnection();
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'tree' | 'raw'>('table');
  const [selectedCellDoc, setSelectedCellDoc] = useState<any | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

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
    <div className="db-content-pane">
      {/* Top Metric Stat Cards Bar */}
      {selectedCollection && (
        <div className="db-metrics-grid">
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

      {/* Toolbar Controls Bar */}
      <div className="db-toolbar">
        {/* View Switcher & Search */}
        <div className="db-row-start">
          <div className="db-pill-switcher">
            <button
              onClick={() => setViewMode('table')}
              className={`db-pill-btn ${viewMode === 'table' ? 'active' : ''}`}
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" /> Table
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`db-pill-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" /> Cards
            </button>

            <button
              onClick={() => setViewMode('tree')}
              className={`db-pill-btn ${viewMode === 'tree' ? 'active' : ''}`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" /> Tree
            </button>

            <button
              onClick={() => setViewMode('raw')}
              className={`db-pill-btn ${viewMode === 'raw' ? 'active' : ''}`}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" /> Monaco JSON
            </button>
          </div>

          {/* Quick Client Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Search current documents..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="db-input pl-8 py-1 text-xs w-44 sm:w-56"
            />
          </div>

          <button
            onClick={onRefresh}
            className="db-icon-btn"
            title="Reload Documents"
          >
            <RefreshCw className={`db-icon-xs ${loading ? 'animate-spin db-icon-emerald' : ''}`} />
          </button>
        </div>

        {/* Right Actions */}
        <div className="db-row-end">
          {selectedDocIds.size > 0 && (
            <span className="db-badge db-badge-cyan">
              {selectedDocIds.size} selected
            </span>
          )}

          <button onClick={handleExportJSON} className="db-btn db-btn-secondary">
            <Code2 className="db-icon-xs db-icon-purple" /> Export JSON
          </button>

          <button onClick={handleExportCSV} className="db-btn db-btn-secondary">
            <FileSpreadsheet className="db-icon-xs db-icon-emerald" /> Export CSV
          </button>

          <button
            onClick={onOpenCreateModal}
            disabled={readOnlyMode}
            className={`db-btn ${readOnlyMode ? 'db-btn-secondary opacity-50' : 'db-btn-primary'}`}
          >
            <Plus className="db-icon-xs" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <div className="db-flex-1 db-overflow-auto db-p-3">
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
          <div className="db-table-wrapper">
            <table className="db-table">
              <thead>
                <tr>
                  <th className="db-text-center">
                    <button onClick={handleToggleSelectAll} className="db-btn-ghost">
                      {selectedDocIds.size === filteredDocuments.length ? <CheckSquare className="db-icon-xs db-icon-emerald" /> : <Square className="db-icon-xs" />}
                    </button>
                  </th>
                  <th className="db-text-center">Actions</th>
                  {columns.map(col => (
                    <th key={col}>
                      <div className="db-row-start">
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
                    <tr key={idx} className={isSelected ? 'active-emerald' : ''}>
                      <td className="db-text-center">
                        <button onClick={() => handleToggleSelectRow(idStr)} className="db-btn-ghost">
                          {isSelected ? <CheckSquare className="db-icon-xs db-icon-emerald" /> : <Square className="db-icon-xs" />}
                        </button>
                      </td>
                      <td className="text-center">
                        <div className="db-row-start justify-center">
                          <button onClick={() => setSelectedCellDoc(doc)} className="db-icon-btn-cyan" title="Inspect">
                            <Eye className="db-icon-xs" />
                          </button>
                          <button onClick={() => onOpenEditModal(doc)} disabled={readOnlyMode} className="db-icon-btn-emerald">
                            <Edit2 className="db-icon-xs" />
                          </button>
                          <button onClick={() => onDeleteDoc(doc)} disabled={readOnlyMode} className="db-icon-btn-danger">
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
                    <button onClick={() => handleCopyDoc(doc, idx)} className="db-icon-btn">
                      {copiedIndex === idx ? <Check className="db-icon-xs db-icon-emerald" /> : <Copy className="db-icon-xs" />}
                    </button>
                    <button onClick={() => onOpenEditModal(doc)} disabled={readOnlyMode} className="db-icon-btn-emerald">
                      <Edit2 className="db-icon-xs" />
                    </button>
                    <button onClick={() => onDeleteDoc(doc)} disabled={readOnlyMode} className="db-icon-btn-danger">
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
                    <button onClick={() => onOpenEditModal(doc)} disabled={readOnlyMode} className="db-icon-btn-emerald">
                      <Edit2 className="db-icon-xs" />
                    </button>
                    <button onClick={() => onDeleteDoc(doc)} disabled={readOnlyMode} className="db-icon-btn-danger">
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
              theme="vs-dark"
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
      <div className="db-footer-pagination">
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
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="db-btn db-btn-secondary db-p-1">
              <ChevronLeft className="db-icon-sm" />
            </button>
            <span className="db-px-2">Page {page} of {totalPages}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="db-btn db-btn-secondary db-p-1">
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
              <span className="db-font-bold db-text-xs db-text-primary">Inspect Document JSON</span>
              <button onClick={() => setSelectedCellDoc(null)} className="db-btn db-btn-secondary db-p-1">✕</button>
            </div>
            <div className="db-flex-1 db-p-2">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
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
