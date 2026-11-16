import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Table as TableIcon,
  Network,
  Code2,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Trash2,
  ShieldAlert,
  FileSpreadsheet,
  RefreshCw,
  LayoutGrid,
  Copy,
  Check,
  Eye,
  Search,
  Layers,
  HardDrive,
  Clock,
  CheckSquare,
  Square,
  Sparkles,
  BarChart3,
  X
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import axios from 'axios';
import { TreeNode } from './TreeView';
import { useConnection } from '../../context/ConnectionContext';

interface DocumentViewerProps {
  documents: any[];
  totalCount: number;
  loading: boolean;
  executionTimeMs: number | null;
  queryError?: string | null;
  onClearQueryError?: () => void;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onRefresh: () => void;
  onOpenEditModal: (doc: any) => void;
  onOpenCreateModal: () => void;
  onDeleteDoc: (doc: any) => void;
  onBulkDeleteDocs?: (selectedDocs: any[]) => void;
  onOpenExportModal?: (selectedDocs: any[]) => void;
  onOpenImportModal?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  totalCount,
  loading,
  executionTimeMs,
  queryError,
  onClearQueryError,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onRefresh,
  onOpenEditModal,
  onOpenCreateModal,
  onDeleteDoc,
  onBulkDeleteDocs,
  onOpenExportModal,
  onOpenImportModal
}) => {
  const { readOnlyMode, selectedCollection, selectedDb, activeProfile, collections, theme } = useConnection();
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'tree' | 'raw'>('table');
  const [selectedCellDoc, setSelectedCellDoc] = useState<any | null>(null);
  useEffect(() => {
    if (!selectedCellDoc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCellDoc(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCellDoc]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  // Clear selections whenever collection or page changes to prevent cross-collection leakage
  useEffect(() => {
    setSelectedDocIds(new Set());
  }, [selectedCollection, page]);

  // Jump to page input state
  const [jumpPageInput, setJumpPageInput] = useState<string>(String(page));
  useEffect(() => {
    setJumpPageInput(String(page));
  }, [page]);

  // In-line cell editing state
  const [editingCell, setEditingCell] = useState<{
    docId: string;
    field: string;
    originalValue: any;
    currentValue: string;
  } | null>(null);
  const [isSavingCell, setIsSavingCell] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const currentCollStats = collections.find(c => c.name === selectedCollection);

  const filteredDocuments = useMemo(() => {
    if (!clientSearch.trim()) return documents;
    const term = clientSearch.toLowerCase();
    return documents.filter(doc =>
      JSON.stringify(doc).toLowerCase().includes(term)
    );
  }, [documents, clientSearch]);

  const columns = useMemo(() => {
    return Array.from(
      new Set(filteredDocuments.flatMap(doc => Object.keys(doc)))
    );
  }, [filteredDocuments]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Table virtualization setup
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredDocuments.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 41,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom = virtualRows.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0)
    : 0;

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

  const handleJumpToPage = (val: string) => {
    const p = parseInt(val, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    } else {
      setJumpPageInput(String(page));
    }
  };

  // Cell editing handlers
  const handleStartCellEdit = (e: React.MouseEvent, doc: any, col: string) => {
    e.stopPropagation();
    if (readOnlyMode) {
      alert('Read-Only Safety Guard is active! Cell editing is disabled.');
      return;
    }
    if (col === '_id') return; // Immutable primary key in MongoDB
    const idStr = doc._id?.$oid || doc._id || '';
    const rawVal = doc[col];
    let stringVal = '';
    if (rawVal === undefined || rawVal === null) {
      stringVal = '';
    } else if (typeof rawVal === 'object') {
      stringVal = JSON.stringify(rawVal);
    } else {
      stringVal = String(rawVal);
    }
    setEditingCell({
      docId: idStr,
      field: col,
      originalValue: rawVal,
      currentValue: stringVal
    });
  };

  const handleCommitCellEdit = async (doc: any) => {
    if (!editingCell || isSavingCell) return;
    const { field, originalValue, currentValue } = editingCell;

    let stringVal = '';
    if (originalValue === undefined || originalValue === null) stringVal = '';
    else if (typeof originalValue === 'object') stringVal = JSON.stringify(originalValue);
    else stringVal = String(originalValue);

    if (stringVal === currentValue) {
      setEditingCell(null);
      return;
    }

    let parsedValue: any = currentValue;
    if (typeof originalValue === 'string') {
      // Preserve string type, including empty string ""
      parsedValue = currentValue;
    } else if (currentValue === 'null' || (currentValue === '' && originalValue === null)) {
      parsedValue = null;
    } else if (currentValue === 'true') {
      parsedValue = true;
    } else if (currentValue === 'false') {
      parsedValue = false;
    } else if (!isNaN(Number(currentValue)) && typeof originalValue === 'number') {
      parsedValue = Number(currentValue);
    } else if (
      (currentValue.startsWith('{') && currentValue.endsWith('}')) ||
      (currentValue.startsWith('[') && currentValue.endsWith(']'))
    ) {
      try {
        parsedValue = JSON.parse(currentValue);
      } catch { }
    }

    try {
      setIsSavingCell(true);
      const filter = doc._id?.$oid ? { _id: { $oid: doc._id.$oid } } : { _id: doc._id };
      await axios.put(
        `/api/documents/${selectedDb}/${selectedCollection}/update`,
        {
          filter,
          update: { $set: { [field]: parsedValue } }
        },
        {
          headers: {
            'x-mongo-uri': activeProfile?.uri,
            'x-readonly': readOnlyMode ? 'true' : 'false'
          }
        }
      );
      setEditingCell(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to save cell edit: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSavingCell(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = selectedDocIds.size > 0
      ? filteredDocuments.filter((d, idx) => selectedDocIds.has(d._id?.$oid || d._id || String(idx)))
      : filteredDocuments;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedCollection || 'documents'}_export_${Date.now()}.json`);
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
    // Add UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    const csvStr = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent([headers, ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvStr);
    downloadAnchor.setAttribute('download', `${selectedCollection || 'documents'}_export_${Date.now()}.csv`);
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
    if (val === undefined || val === null) {
      return <span className="text-slate-500 italic font-mono text-xs">null</span>;
    }
    if (typeof val === 'object') {
      if (val.$oid) {
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-oid" title="BSON ObjectId">OID</span>
            <span className="text-purple-300 select-all" title={val.$oid}>{val.$oid}</span>
          </div>
        );
      }
      if (val.$date) {
        const d = new Date(val.$date);
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-date" title="BSON ISODate">DATE</span>
            <span className="text-amber-300" title={d.toISOString()}>{d.toLocaleString()}</span>
          </div>
        );
      }
      if (val.$numberLong !== undefined) {
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-int64" title="BSON 64-bit Long Integer">INT64</span>
            <span className="text-blue-300">{val.$numberLong}</span>
          </div>
        );
      }
      if (val.$numberDecimal !== undefined) {
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-dec" title="BSON 128-bit Decimal">DEC</span>
            <span className="text-emerald-300">{val.$numberDecimal}</span>
          </div>
        );
      }
      if (val.$binary !== undefined) {
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-bin" title="BSON Binary">BIN</span>
            <span className="text-rose-300">Binary({val.$binary?.subType || '00'})</span>
          </div>
        );
      }
      if (Array.isArray(val)) {
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-arr" title="Array">ARR [{val.length}]</span>
            <span className="text-slate-300 truncate max-w-[180px]">{JSON.stringify(val)}</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="db-bson-badge db-bson-obj" title="Embedded Object">OBJ</span>
          <span className="text-cyan-300/80 truncate max-w-[180px]">{JSON.stringify(val)}</span>
        </div>
      );
    }
    if (typeof val === 'boolean') {
      return (
        <div className="flex items-center gap-1 font-mono text-xs">
          <span className="db-bson-badge db-bson-bool">BOOL</span>
          <span className="text-pink-400 font-semibold">{val ? 'true' : 'false'}</span>
        </div>
      );
    }
    if (typeof val === 'number') {
      return (
        <div className="flex items-center gap-1 font-mono text-xs">
          <span className="db-bson-badge db-bson-num">NUM</span>
          <span className="text-cyan-400 font-medium">{val.toLocaleString()}</span>
        </div>
      );
    }
    if (typeof val === 'string') {
      if (/^[0-9a-fA-F]{24}$/.test(val)) {
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-oid" title="24-char ObjectId String">OID</span>
            <span className="text-purple-300 select-all">{val}</span>
          </div>
        );
      }
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="db-bson-badge db-bson-date" title="ISO Date String">DATE</span>
            <span className="text-amber-300">{val}</span>
          </div>
        );
      }
      return <span className="truncate max-w-[240px] inline-block font-sans text-xs text-[var(--text-primary)]">{val}</span>;
    }
    return <span className="truncate max-w-[240px] inline-block text-xs">{String(val)}</span>;
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
      {/* Top Metric Stat Cards Bar (Collapsible) */}
      {selectedCollection && showDetailedStats && (
        <div className="db-metrics-grid animate-fade-in">
          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Total Documents</span>
              <span className="db-stat-value db-text-emerald">
                {(currentCollStats?.count || totalCount).toLocaleString()}
              </span>
            </div>
            <TableIcon className="w-4 h-4 db-icon-emerald" />
          </div>

          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Query Execution</span>
              <span className="db-stat-value db-text-cyan">
                {executionTimeMs !== null ? `${executionTimeMs} ms` : '0 ms'}
              </span>
            </div>
            <Clock className="w-4 h-4 db-icon-cyan" />
          </div>

          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Storage Size</span>
              <span className="db-stat-value db-text-purple">
                {formatSize(currentCollStats?.size || 0)}
              </span>
            </div>
            <HardDrive className="w-4 h-4 db-icon-purple" />
          </div>

          <div className="db-stat-card">
            <div>
              <span className="db-stat-label">Index Count</span>
              <span className="db-stat-value db-text-amber">
                {currentCollStats?.indexesCount || 1}
              </span>
            </div>
            <Layers className="w-4 h-4 db-icon-amber" />
          </div>
        </div>
      )}

      {/* Query Execution Server Error Banner */}
      {queryError && (
        <div className="mx-4 mt-2 mb-1 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-rose-200">Query Execution Error: </span>
              <span className="font-mono">{queryError}</span>
            </div>
          </div>
          {onClearQueryError && (
            <button
              onClick={onClearQueryError}
              className="px-2 py-1 rounded bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 text-xs font-medium transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="db-toolbar py-1.5 px-3 flex-wrap gap-2">
        {/* Left Actions */}
        <div className="db-row-start gap-2 flex-wrap">
          {/* View Mode Toggle Segmented Control */}
          <div className="db-view-mode-group" role="tablist" aria-label="Document View Mode">
            <button
              onClick={() => setViewMode('table')}
              className={`db-view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table View (Virtual Scroll, In-Line Editing, BSON badges)"
              role="tab"
              aria-selected={viewMode === 'table'}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`db-view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Card Grid View"
              role="tab"
              aria-selected={viewMode === 'grid'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`db-view-mode-btn ${viewMode === 'tree' ? 'active' : ''}`}
              title="Hierarchical Tree View"
              role="tab"
              aria-selected={viewMode === 'tree'}
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tree</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`db-view-mode-btn ${viewMode === 'raw' ? 'active' : ''}`}
              title="Monaco Raw JSON Editor"
              role="tab"
              aria-selected={viewMode === 'raw'}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>

          {/* Toggle Detailed Metrics */}
          {selectedCollection && (
            <button
              onClick={() => setShowDetailedStats(!showDetailedStats)}
              className={`db-stats-toggle-btn ${showDetailedStats ? 'active' : ''}`}
              title="Toggle Detailed Metrics Cards (Storage, Latency, Indexes)"
              aria-pressed={showDetailedStats}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${showDetailedStats ? 'db-icon-emerald' : ''}`} />
              <span className="hidden sm:inline">Stats</span>
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
            <Search className="w-3.5 h-3.5 absolute right-2.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search in page..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="db-input pl-8 pr-6 py-1 text-xs w-28 sm:w-40"
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
            <>
              <span className="db-badge db-badge-cyan text-xs">
                {selectedDocIds.size} selected
              </span>
              {onBulkDeleteDocs && (
                <button
                  onClick={() => {
                    const selectedDocs = filteredDocuments.filter((d, idx) => selectedDocIds.has(d._id?.$oid || d._id || String(idx)));
                    onBulkDeleteDocs(selectedDocs);
                  }}
                  disabled={readOnlyMode}
                  className="db-btn db-btn-danger db-text-xs py-1 px-2"
                  title="Bulk Delete Selected Documents"
                >
                  <Trash2 className="db-icon-xs" />
                  <span>Delete ({selectedDocIds.size})</span>
                </button>
              )}
            </>
          )}

          {/* Export Button (Opens Advanced Modal if provided, or fallback quick JSON/CSV) */}
          {onOpenExportModal ? (
            <button
              onClick={() => {
                const selectedDocs = selectedDocIds.size > 0
                  ? filteredDocuments.filter((d, idx) => selectedDocIds.has(d._id?.$oid || d._id || String(idx)))
                  : filteredDocuments;
                onOpenExportModal(selectedDocs);
              }}
              className="db-btn db-btn-secondary db-text-xs py-1 px-2"
              title="Open Export Wizard (CSV with BOM, NDJSON, JSON array)"
            >
              <Download className="db-icon-xs db-icon-cyan" />
              <span className="hidden md:inline">Export</span>
            </button>
          ) : (
            <>
              <button onClick={handleExportJSON} className="db-btn db-btn-secondary db-text-xs py-1 px-2" title="Export as JSON">
                <Code2 className="db-icon-xs db-icon-purple" />
                <span className="hidden md:inline">Export JSON</span>
              </button>
              <button onClick={handleExportCSV} className="db-btn db-btn-secondary db-text-xs py-1 px-2" title="Export as CSV">
                <FileSpreadsheet className="db-icon-xs db-icon-emerald" />
                <span className="hidden md:inline">Export CSV</span>
              </button>
            </>
          )}

          {/* Import Button */}
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              disabled={readOnlyMode}
              className={`db-btn db-btn-secondary db-text-xs py-1 px-2 ${readOnlyMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Open Import Wizard (JSON, CSV, NDJSON)"
            >
              <Upload className="db-icon-xs db-icon-amber" />
              <span className="hidden md:inline">Import</span>
            </button>
          )}

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
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2 relative">
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
          /* Virtualized Table View with In-Line Editing */
          <div ref={tableContainerRef} className="db-table-wrapper flex-1 min-h-0 overflow-auto">
            <table className="db-table">
              <thead>
                <tr>
                  <th className="db-text-center w-10">
                    <button onClick={handleToggleSelectAll} className="db-btn-ghost">
                      {selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0 ? (
                        <CheckSquare className="db-icon-xs db-icon-emerald" />
                      ) : (
                        <Square className="db-icon-xs" />
                      )}
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
                {paddingTop > 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} style={{ height: `${paddingTop}px`, padding: 0, border: 0 }} />
                  </tr>
                )}
                {virtualRows.map(virtualRow => {
                  const doc = filteredDocuments[virtualRow.index];
                  const idx = virtualRow.index;
                  const idStr = doc._id?.$oid || doc._id || String(idx);
                  const isSelected = selectedDocIds.has(idStr);

                  return (
                    <tr
                      key={virtualRow.key}
                      className={isSelected ? 'active-emerald' : ''}
                      title="Double-click any cell to edit in-place, or click actions on left"
                    >
                      <td className="db-text-center">
                        <button onClick={() => handleToggleSelectRow(idStr)} className="db-btn-ghost">
                          {isSelected ? (
                            <CheckSquare className="db-icon-xs db-icon-emerald" />
                          ) : (
                            <Square className="db-icon-xs" />
                          )}
                        </button>
                      </td>
                      <td className="text-center">
                        <div className="db-row-start justify-center gap-1">
                          <button onClick={() => setSelectedCellDoc(doc)} className="db-icon-btn-cyan p-1" title="Inspect Document">
                            <Eye className="db-icon-xs" />
                          </button>
                          <button onClick={() => onOpenEditModal(doc)} disabled={readOnlyMode} className="db-icon-btn-emerald p-1" title="Edit Document Modal">
                            <Edit2 className="db-icon-xs" />
                          </button>
                          <button onClick={() => onDeleteDoc(doc)} disabled={readOnlyMode} className="db-icon-btn-danger p-1" title="Delete Document">
                            <Trash2 className="db-icon-xs" />
                          </button>
                        </div>
                      </td>
                      {columns.map(col => {
                        const isEditingThisCell = editingCell && editingCell.docId === idStr && editingCell.field === col;
                        return (
                          <td
                            key={col}
                            className={col !== '_id' ? 'db-cell-editable' : ''}
                            onDoubleClick={(e) => handleStartCellEdit(e, doc, col)}
                          >
                            {isEditingThisCell ? (
                              <div className="flex items-center gap-1">
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={editingCell.currentValue}
                                  onChange={(e) => setEditingCell({ ...editingCell, currentValue: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCommitCellEdit(doc);
                                    } else if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                  onBlur={() => handleCommitCellEdit(doc)}
                                  disabled={isSavingCell}
                                  className="db-cell-edit-input"
                                  title="Press Enter to save, Esc to cancel"
                                />
                                {isSavingCell && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />}
                              </div>
                            ) : (
                              renderCellValue(doc[col])
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} style={{ height: `${paddingBottom}px`, padding: 0, border: 0 }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="flex-1 min-h-0 w-full overflow-y-auto">
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
          </div>
        ) : viewMode === 'tree' ? (
          /* Tree View */
          <div className="flex-1 min-h-0 w-full overflow-y-auto p-1">
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
          </div>
        ) : (
          /* Monaco Raw JSON View */
          <div className="db-editor-container flex-1 min-h-0 w-full">
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

      {/* Offset Pagination Footer */}
      <div className="db-footer-pagination py-1.5 px-3 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
        <div className="text-xs text-[var(--text-muted)] font-mono whitespace-nowrap select-none flex-shrink-0">
          Showing <span className="text-[var(--text-primary)] font-semibold">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span>–<span className="text-[var(--text-primary)] font-semibold">{Math.min(page * limit, totalCount)}</span>&nbsp;of&nbsp;<span className="text-[var(--text-primary)] font-semibold">{totalCount.toLocaleString()}</span>&nbsp;records
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] whitespace-nowrap select-none flex-shrink-0">
            <span className="whitespace-nowrap">Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="db-select text-xs py-0.5 px-1.5 w-auto"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              className="db-btn db-btn-secondary p-1"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="db-btn db-btn-secondary p-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-1 text-xs text-[var(--text-muted)] whitespace-nowrap select-none flex-shrink-0">
              <span className="whitespace-nowrap">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJumpToPage(jumpPageInput);
                }}
                onBlur={() => handleJumpToPage(jumpPageInput)}
                className="db-input w-12 text-center py-0.5 px-1 text-xs font-mono font-bold"
                title="Type page number and press Enter"
              />
              <span className="whitespace-nowrap">of&nbsp;{totalPages.toLocaleString()}</span>
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="db-btn db-btn-secondary p-1"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="db-btn db-btn-secondary p-1"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cell Inspect Modal */}
      {selectedCellDoc && (
        <div className="db-modal-overlay" onClick={() => setSelectedCellDoc(null)}>
          <div className="db-modal-box db-modal-lg db-modal-editor-box" onClick={(e) => e.stopPropagation()}>

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
