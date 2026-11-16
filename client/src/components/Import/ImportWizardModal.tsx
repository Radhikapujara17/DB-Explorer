import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  Code2,
  FileText,
  Check,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { selectedCollection, selectedDb, activeProfile, readOnlyMode } = useConnection();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsedDocs, setParsedDocs] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Settings
  const [conflictMode, setConflictMode] = useState<'skip' | 'replace' | 'abort'>('skip');
  const [batchSize, setBatchSize] = useState<number>(200);

  // Progress & Execution
  const [isImporting, setIsImporting] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    failed: number;
    error?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseFileContent = (content: string, name: string) => {
    setParseError(null);
    try {
      const trimmed = content.trim();
      let docs: any[] = [];

      if (name.endsWith('.csv') || (!trimmed.startsWith('[') && !trimmed.startsWith('{') && trimmed.includes(','))) {
        // Parse CSV with RFC-4180 quotes & escaped commas support
        const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('CSV must contain a header row and at least one data row.');
        const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const rowVals = parseCsvLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
          const doc: any = {};
          headers.forEach((h, colIdx) => {
            const raw = rowVals[colIdx] ?? '';
            // Auto parse numbers and booleans
            if (raw === 'true') doc[h] = true;
            else if (raw === 'false') doc[h] = false;
            else if (!isNaN(Number(raw)) && raw !== '') doc[h] = Number(raw);
            else doc[h] = raw;
          });
          docs.push(doc);
        }
      } else {
        // Check if entire content is standard JSON (Array or single Object)
        let isParsedAsJson = false;
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            docs = parsed;
            isParsedAsJson = true;
          } else if (typeof parsed === 'object' && parsed !== null) {
            docs = [parsed];
            isParsedAsJson = true;
          }
        } catch {
          // If not valid single JSON, proceed to NDJSON
        }

        if (!isParsedAsJson) {
          // Parse as NDJSON (newline-delimited JSON)
          const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
          docs = lines.map((line, idx) => {
            try {
              return JSON.parse(line);
            } catch {
              throw new Error(`Invalid JSON syntax on line ${idx + 1}`);
            }
          });
        }
      }

      if (docs.length === 0) throw new Error('No valid documents found in file.');
      setParsedDocs(docs);
      setStep(2);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file content.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseFileContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleStartImport = async () => {
    if (parsedDocs.length === 0 || isImporting || readOnlyMode) return;
    setIsImporting(true);
    setProgressCount(0);
    setImportResult(null);

    let inserted = 0;
    let failed = 0;
    const total = parsedDocs.length;

    try {
      // Chunk parsedDocs into batches
      for (let i = 0; i < total; i += batchSize) {
        const batch = parsedDocs.slice(i, i + batchSize);

        try {
          const res = await axios.post(
            `/api/documents/${selectedDb}/${selectedCollection}/insert`,
            { document: batch },
            {
              headers: {
                'x-mongo-uri': activeProfile?.uri,
                'x-readonly': readOnlyMode ? 'true' : 'false'
              }
            }
          );
          if (res.data.success) {
            inserted += (res.data.insertedCount || batch.length);
          } else {
            if (conflictMode === 'abort') {
              throw new Error(res.data.error || 'Batch insert error');
            }
            failed += batch.length;
          }
        } catch (err: any) {
          if (conflictMode === 'abort') {
            throw err;
          }
          failed += batch.length;
        }

        setProgressCount(Math.min(i + batchSize, total));
      }

      setImportResult({ inserted, failed });
      setStep(3);
      onSuccess();
    } catch (err: any) {
      setImportResult({
        inserted,
        failed,
        error: err.response?.data?.error || err.message || 'Import aborted due to error.'
      });
      setStep(3);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-color)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Data Import Wizard</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Import JSON, CSV, or NDJSON into collection: <strong className="text-emerald-400 font-mono">{selectedCollection}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-[var(--bg-panel)] border-b border-[var(--border-color)] flex items-center gap-4 text-xs">
          <span className={`font-semibold flex items-center gap-1.5 ${step === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px]">1</span> Upload File
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`font-semibold flex items-center gap-1.5 ${step === 2 ? 'text-amber-400' : step > 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px]">2</span> Preview & Options
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`font-semibold flex items-center gap-1.5 ${step === 3 ? 'text-amber-400' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[11px]">3</span> Progress & Results
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {readOnlyMode && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Read-Only Safety Guard is active. Data imports are locked.</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-[var(--border-color)] hover:border-amber-400 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer bg-[var(--bg-card)]/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-400 mb-3 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Choose a file or drag it here</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">Supports .json (Array), .csv (Comma-separated), or .ndjson</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.ndjson,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {parseError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Parsed <strong>{parsedDocs.length}</strong> valid documents from {fileName || 'input'}</span>
                </div>
                <button
                  onClick={() => { setStep(1); setParsedDocs([]); }}
                  className="text-xs underline hover:text-white"
                >
                  Choose another file
                </button>
              </div>

              {/* Conflict Handling & Batch Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Duplicate Conflict Handling</label>
                  <select
                    value={conflictMode}
                    onChange={(e) => setConflictMode(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                  >
                    <option value="skip">Skip duplicates (Ignore errors)</option>
                    <option value="abort">Abort on first duplicate error</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Batch Size</label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                  >
                    <option value={50}>50 docs per batch</option>
                    <option value={200}>200 docs per batch</option>
                    <option value={500}>500 docs per batch</option>
                  </select>
                </div>
              </div>

              {/* Sample Preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Sample Preview (First 2 Documents)
                </label>
                <pre className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(parsedDocs.slice(0, 2), null, 2)}
                </pre>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {importResult && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  importResult.error
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {importResult.error ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <Check className="w-5 h-5 text-emerald-400" />}
                    <span>{importResult.error ? 'Import Encountered an Error' : 'Import Completed Successfully!'}</span>
                  </div>
                  <div className="text-xs space-y-1 text-[var(--text-secondary)]">
                    <div>Successfully Inserted: <strong className="text-emerald-400 font-mono">{importResult.inserted}</strong> docs</div>
                    {importResult.failed > 0 && (
                      <div>Skipped / Failed: <strong className="text-rose-400 font-mono">{importResult.failed}</strong> docs</div>
                    )}
                    {importResult.error && (
                      <div className="text-rose-400 font-mono text-[11px] mt-1">{importResult.error}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar during execution */}
          {isImporting && (
            <div className="space-y-2 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-primary)]">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Inserting batches into MongoDB...
                </span>
                <span className="font-mono text-amber-400">
                  {progressCount} / {parsedDocs.length} ({Math.round((progressCount / parsedDocs.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-[var(--bg-panel)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div
                  className="bg-amber-400 h-full transition-all duration-200"
                  style={{ width: `${(progressCount / parsedDocs.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-end gap-2">
          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isImporting}
                className="db-btn db-btn-secondary db-text-xs py-1.5 px-3"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStartImport}
                disabled={isImporting || readOnlyMode || parsedDocs.length === 0}
                className="db-btn db-btn-primary db-text-xs py-1.5 px-4 flex items-center gap-1.5 disabled:opacity-40"
              >
                {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Start Batch Import ({parsedDocs.length} docs)</span>
              </button>
            </>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className="db-btn db-btn-primary db-text-xs py-1.5 px-4"
            >
              Done
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="db-btn db-btn-secondary db-text-xs py-1.5 px-3"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
