import React, { useState, useMemo } from 'react';
import {
  Download,
  X,
  FileSpreadsheet,
  Code2,
  FileText,
  CheckSquare,
  Square,
  Check,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: any[];
  selectedDocuments: any[];
  totalCount: number;
  columns: string[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  documents,
  selectedDocuments,
  totalCount,
  columns
}) => {
  const { selectedCollection, selectedDb } = useConnection();

  // Export format: 'csv' | 'ndjson' | 'json'
  const [format, setFormat] = useState<'csv' | 'ndjson' | 'json'>('csv');

  // Scope: 'current' | 'selected'
  const [scope, setScope] = useState<'current' | 'selected'>('current');

  // CSV Options
  const [includeExcelBom, setIncludeExcelBom] = useState(true);
  const [csvDelimiter, setCsvDelimiter] = useState<',' | ';' | '\t'>(',');

  // JSON Options
  const [jsonIndented, setJsonIndented] = useState(true);

  // Field Selection
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(columns));

  // Sync columns if they change
  React.useEffect(() => {
    setSelectedFields(new Set(columns));
  }, [columns]);

  const targetDocs = scope === 'selected' && selectedDocuments.length > 0
    ? selectedDocuments
    : documents;

  // Toggle field selection
  const handleToggleField = (field: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleSelectAllFields = () => {
    if (selectedFields.size === columns.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(columns));
    }
  };

  // Filter documents to include only selected fields
  const projectedDocs = targetDocs.map(doc => {
    if (selectedFields.size === columns.length) return doc;
    const proj: any = {};
    for (const key of selectedFields) {
      if (key in doc) proj[key] = doc[key];
    }
    return proj;
  });

  // Generate Preview string
  const previewContent = useMemo(() => {
    const previewDocs = projectedDocs.slice(0, 2);
    if (previewDocs.length === 0) return 'No documents to preview';

    if (format === 'json') {
      return JSON.stringify(previewDocs, null, jsonIndented ? 2 : undefined);
    } else if (format === 'ndjson') {
      return previewDocs.map(d => JSON.stringify(d)).join('\n');
    } else {
      // CSV
      const fields = Array.from(selectedFields);
      const headerRow = fields.join(csvDelimiter);
      const rows = previewDocs.map(doc =>
        fields.map(field => {
          const val = doc[field];
          if (val === undefined || val === null) return '""';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(csvDelimiter)
      );
      return [headerRow, ...rows].join('\n');
    }
  }, [projectedDocs, format, jsonIndented, csvDelimiter, selectedFields]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Execute Download
  const handleExecuteExport = () => {
    let outputContent = '';
    let mimeType = 'text/plain';
    let fileExt = 'txt';

    if (format === 'json') {
      mimeType = 'application/json';
      fileExt = 'json';
      outputContent = JSON.stringify(projectedDocs, null, jsonIndented ? 2 : undefined);
    } else if (format === 'ndjson') {
      mimeType = 'application/x-ndjson';
      fileExt = 'ndjson';
      outputContent = projectedDocs.map(d => JSON.stringify(d)).join('\n');
    } else {
      // CSV
      mimeType = 'text/csv';
      fileExt = 'csv';
      const fields = Array.from(selectedFields);
      const headerRow = fields.join(csvDelimiter);
      const rows = projectedDocs.map(doc =>
        fields.map(field => {
          const val = doc[field];
          if (val === undefined || val === null) return '""';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(csvDelimiter)
      );
      const body = [headerRow, ...rows].join('\n');
      outputContent = (includeExcelBom ? '\uFEFF' : '') + body;
    }

    const blob = new Blob([outputContent], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCollection || 'export'}_${Date.now()}.${fileExt}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-color)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-[var(--accent-cyan)]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Data Export Wizard</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Export {selectedCollection} data to CSV, NDJSON, or JSON with customized formatting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Export Format Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              1. Choose Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  format === 'csv'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  {format === 'csv' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">CSV / Excel</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Compatible with Excel, Sheets, & BI tools</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('ndjson')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  format === 'ndjson'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  {format === 'ndjson' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">NDJSON (Lines)</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Newline-delimited, mongoimport ready</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                  format === 'json'
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  {format === 'json' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">JSON Array</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Standard document array</p>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              2. Export Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  scope === 'current'
                    ? 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/40 text-[var(--text-primary)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                }`}
              >
                <div className="font-semibold text-[var(--text-primary)]">Current Page View</div>
                <div className="text-[11px] text-[var(--text-muted)]">{documents.length} documents on current page</div>
              </button>

              <button
                type="button"
                disabled={selectedDocuments.length === 0}
                onClick={() => setScope('selected')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  scope === 'selected'
                    ? 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/40 text-[var(--text-primary)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                } ${selectedDocuments.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="font-semibold text-[var(--text-primary)]">Selected Rows Only</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {selectedDocuments.length > 0 ? `${selectedDocuments.length} rows checked` : 'No rows checked'}
                </div>
              </button>
            </div>
            {totalCount > documents.length && scope === 'current' && (
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] leading-relaxed">
                <span className="font-semibold text-cyan-200">Page Export Window:</span> Exporting current {documents.length} visible documents out of {totalCount.toLocaleString()} total collection records. Adjust the page limit in the table footer to export larger batches.
              </div>
            )}
          </div>

          {/* Format-Specific Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              3. Format Settings
            </label>
            <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] space-y-2 text-xs">
              {format === 'csv' && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={includeExcelBom}
                      onChange={(e) => setIncludeExcelBom(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Include Excel UTF-8 BOM (\uFEFF) to prevent garbled international characters</span>
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[var(--text-muted)] text-[11px]">Delimiter:</span>
                    <select
                      value={csvDelimiter}
                      onChange={(e) => setCsvDelimiter(e.target.value as any)}
                      className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                      <option value="&#9;">Tab (\t)</option>
                    </select>
                  </div>
                </>
              )}

              {format === 'ndjson' && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  NDJSON exports one JSON object per newline. Each document retains all BSON nested types.
                </p>
              )}

              {format === 'json' && (
                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={jsonIndented}
                    onChange={(e) => setJsonIndented(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>Format output with 2-space indentation (pretty-print)</span>
                </label>
              )}
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                4. Select Fields to Include ({selectedFields.size} of {columns.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAllFields}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {selectedFields.size === columns.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
              {columns.map(col => {
                const isChecked = selectedFields.has(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleToggleField(col)}
                    className="flex items-center gap-1.5 text-left p-1 rounded hover:bg-white/5 text-xs"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="font-mono text-[11px] truncate text-[var(--text-primary)]">{col}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Output Preview (First 2 Records)
            </label>
            <pre className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-28 whitespace-pre-wrap">
              {previewContent}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Ready to export <strong>{projectedDocs.length}</strong> documents
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="db-btn db-btn-secondary db-text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={projectedDocs.length === 0 || selectedFields.size === 0}
              className="db-btn db-btn-primary db-text-xs py-1.5 px-4 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
