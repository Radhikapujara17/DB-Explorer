import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Code2, ShieldAlert, Sparkles, Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDocument?: any; // null for Create, doc for Edit
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDocument
}) => {
  const { activeProfile, selectedDb, selectedCollection, readOnlyMode, theme } = useConnection();
  const isEditing = !!initialDocument;

  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formatted, setFormatted] = useState(false);

  // Synchronize JSON editor content whenever modal opens or document changes
  useEffect(() => {
    if (isOpen) {
      if (initialDocument) {
        setJsonText(JSON.stringify(initialDocument, null, 2));
      } else {
        setJsonText('{\n  "title": "Sample Item",\n  "createdAt": { "$date": "' + new Date().toISOString() + '" }\n}');
      }
      setError(null);
      setCopied(false);
      setFormatted(false);
    }
  }, [initialDocument, isOpen]);

  const handleSave = async () => {
    if (readOnlyMode) {
      setError('Read-Only Safety Guard is enabled! Cannot insert or modify documents.');
      return;
    }

    if (!selectedDb || !selectedCollection) {
      setError('No active database or collection selected.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let parsedDoc: any;
      try {
        parsedDoc = JSON.parse(jsonText);
      } catch (err: any) {
        setError(`JSON Syntax Error: ${err.message}`);
        setSubmitting(false);
        return;
      }

      if (typeof parsedDoc !== 'object' || parsedDoc === null) {
        setError('Document must be a valid JSON object.');
        setSubmitting(false);
        return;
      }

      if (isEditing) {
        // Update document using original _id filter
        const filter = initialDocument._id ? { _id: initialDocument._id } : { ...initialDocument };
        const res = await axios.put(
          `/api/documents/${selectedDb}/${selectedCollection}/update`,
          { filter, update: parsedDoc },
          { headers: { 'x-mongo-uri': activeProfile?.uri } }
        );
        if (res.data.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.data.error || 'Update failed');
        }
      } else {
        // Insert new document
        const res = await axios.post(
          `/api/documents/${selectedDb}/${selectedCollection}/insert`,
          { document: parsedDoc },
          { headers: { 'x-mongo-uri': activeProfile?.uri } }
        );
        if (res.data.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.data.error || 'Insert failed');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // Keyboard shortcut listener for Esc and Ctrl+S / Cmd+S
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
      setFormatted(true);
      setTimeout(() => setFormatted(false), 2000);
    } catch (err: any) {
      setError(`Cannot format invalid JSON: ${err.message}`);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const docIdDisplay = initialDocument?._id?.$oid || initialDocument?._id;

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box db-modal-lg db-modal-editor-box animate-fade-in">
        {/* Header */}
        <div className="db-modal-header">
          <div className="db-row-start db-space-x-2">
            <Code2 className="db-icon-sm db-icon-emerald" />
            <div>
              <h3 className="db-text-sm db-font-bold db-text-primary">
                {isEditing ? 'Edit Document' : 'Insert New Document'}
              </h3>
              {isEditing && docIdDisplay && (
                <div className="db-text-xs db-text-muted db-font-mono truncate max-w-sm">
                  _id: {String(docIdDisplay)}
                </div>
              )}
            </div>
            {isEditing ? (
              <span className="db-badge db-badge-cyan db-text-xs">
                Editing
              </span>
            ) : (
              <span className="db-badge db-badge-emerald db-text-xs">
                New
              </span>
            )}
          </div>
          <div className="db-row-end">
            <button
              onClick={handleFormatJson}
              className="db-btn db-btn-secondary db-text-xs"
              title="Prettify and format JSON"
            >
              <Sparkles className="db-icon-xs db-icon-amber" />
              <span>{formatted ? 'Formatted!' : 'Format'}</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="db-btn db-btn-secondary db-text-xs"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="db-icon-xs db-icon-emerald" /> : <Copy className="db-icon-xs" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="db-btn db-btn-secondary db-p-1"
              title="Close modal (Esc)"
            >
              <X className="db-icon-sm" />
            </button>
          </div>
        </div>

        {/* Read only Warning Banner */}
        {readOnlyMode && (
          <div className="db-alert-box">
            <ShieldAlert className="db-icon-sm db-icon-amber" />
            <span>Read-Only Guard Active! Modifications are disabled. Toggle off Read-Only in header to save changes.</span>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 min-h-[380px] relative p-2 border-y border-[var(--border-color)] bg-[var(--bg-card)]">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme={theme === 'theme-light' ? 'light' : 'vs-dark'}
            value={jsonText}
            onChange={(value) => setJsonText(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'Fira Code, monospace',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              lineHeight: 22,
              tabSize: 2,
              padding: { top: 10, bottom: 10 }
            }}
          />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="db-alert-box">
            <AlertCircle className="db-icon-sm db-icon-rose" />
            <span className="break-all">{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="db-modal-footer">
          <div className="db-row-start db-space-x-3">
            <span className="db-text-xs db-text-muted db-font-mono">Extended JSON format supported ($date, $oid)</span>
            <span className="db-text-xs db-text-slate-500 hidden sm:inline">• Ctrl+S to save</span>
          </div>
          <div className="db-row-end">
            <button
              onClick={onClose}
              className="db-btn db-btn-secondary db-text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting || readOnlyMode}
              className="db-btn db-btn-primary db-text-xs"
            >
              <Save className="db-icon-xs" />
              <span>{submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Insert Document'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
