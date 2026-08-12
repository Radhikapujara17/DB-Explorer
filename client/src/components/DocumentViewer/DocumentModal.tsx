import React, { useState } from 'react';
import { X, Save, AlertCircle, Code2, ShieldAlert } from 'lucide-react';
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
  const { activeProfile, selectedDb, selectedCollection, readOnlyMode } = useConnection();
  const isEditing = !!initialDocument;

  const [jsonText, setJsonText] = useState(() => {
    if (initialDocument) {
      return JSON.stringify(initialDocument, null, 2);
    }
    return '{\n  "title": "Sample Item",\n  "createdAt": { "$date": "' + new Date().toISOString() + '" }\n}';
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (readOnlyMode) {
      setError('Read-Only Safety Guard is enabled! Cannot insert or modify documents.');
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

      if (isEditing) {
        // Update document using _id filter
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

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box db-modal-lg db-modal-editor-box animate-fade-in">
        {/* Header */}
        <div className="db-modal-header">
          <div className="db-row-start">
            <Code2 className="db-icon-sm db-icon-emerald" />
            <h3 className="db-text-sm db-font-bold db-text-primary">
              {isEditing ? 'Edit Document' : 'Insert New Document'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="db-btn db-btn-secondary db-p-1"
          >
            <X className="db-icon-sm" />
          </button>
        </div>

        {/* Read only Warning Banner */}
        {readOnlyMode && (
          <div className="db-alert-box">
            <ShieldAlert className="db-icon-sm db-icon-amber" />
            <span>Read-Only Guard Active! Modifications are disabled. Toggle off Read-Only in header to save changes.</span>
          </div>
        )}

        {/* Editor Content */}
        <div className="db-flex-1 db-relative db-p-2">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
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
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="db-modal-footer">
          <span className="db-text-xs db-text-muted db-font-mono">Extended JSON format supported ($date, $oid)</span>
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
