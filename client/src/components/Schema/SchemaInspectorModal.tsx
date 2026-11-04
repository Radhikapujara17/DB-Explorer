import React, { useState, useEffect } from 'react';
import { X, Layers, Key, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface SchemaInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbName: string | null;
  collectionName: string | null;
}

interface FieldInfo {
  name: string;
  types: string[];
  sampleValue: any;
  presencePercentage: number;
}

interface IndexInfo {
  v: number;
  key: Record<string, number | string>;
  name: string;
  unique?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  number: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  boolean: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  ObjectId: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Date: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  Array: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Object: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  null: 'bg-red-500/15 text-red-400 border-red-500/30'
};

export const SchemaInspectorModal: React.FC<SchemaInspectorModalProps> = ({
  isOpen,
  onClose,
  dbName,
  collectionName
}) => {
  const { activeProfile, readOnlyMode } = useConnection();
  const [activeTab, setActiveTab] = useState<'schema' | 'indexes'>('schema');
  
  // Schema State
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [totalSampled, setTotalSampled] = useState(0);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [sampleSize, setSampleSize] = useState(100);

  // Indexes State
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [loadingIndexes, setLoadingIndexes] = useState(false);
  const [newIndexField, setNewIndexField] = useState('');
  const [newIndexOrder, setNewIndexOrder] = useState<'1' | '-1'>('1');
  const [newIndexUnique, setNewIndexUnique] = useState(false);
  const [creatingIndex, setCreatingIndex] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && dbName && collectionName && activeProfile) {
      fetchSchema();
      fetchIndexes();
      setMessage(null);
    }
  }, [isOpen, dbName, collectionName, activeProfile, sampleSize]);

  const fetchSchema = async () => {
    if (!activeProfile || !dbName || !collectionName) return;
    setLoadingSchema(true);
    try {
      const res = await axios.get(
        `/api/schema/${dbName}/${collectionName}/infer?sampleSize=${sampleSize}`,
        { headers: { 'x-mongo-uri': activeProfile.uri } }
      );
      if (res.data.success) {
        setFields(res.data.fields || []);
        setTotalSampled(res.data.totalSampled || 0);
      }
    } catch (err: any) {
      console.error('Failed to infer schema:', err);
    } finally {
      setLoadingSchema(false);
    }
  };

  const fetchIndexes = async () => {
    if (!activeProfile || !dbName || !collectionName) return;
    setLoadingIndexes(true);
    try {
      const res = await axios.get(
        `/api/indexes/${dbName}/${collectionName}`,
        { headers: { 'x-mongo-uri': activeProfile.uri } }
      );
      if (res.data.success) {
        setIndexes(res.data.indexes || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch indexes:', err);
    } finally {
      setLoadingIndexes(false);
    }
  };

  const handleCreateIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnlyMode) {
      setMessage({ type: 'error', text: 'Read-only mode is active. Cannot create indexes.' });
      return;
    }
    if (!newIndexField.trim() || !activeProfile || !dbName || !collectionName) return;

    setCreatingIndex(true);
    setMessage(null);
    try {
      const fieldSpecs: Record<string, number> = {
        [newIndexField.trim()]: Number(newIndexOrder)
      };
      const res = await axios.post(
        `/api/indexes/${dbName}/${collectionName}/create`,
        { fieldSpecs, isUnique: newIndexUnique },
        { headers: { 'x-mongo-uri': activeProfile.uri } }
      );
      if (res.data.success) {
        setMessage({ type: 'success', text: `Index "${res.data.indexName}" created successfully!` });
        setNewIndexField('');
        setNewIndexUnique(false);
        fetchIndexes();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setCreatingIndex(false);
    }
  };

  const handleDropIndex = async (indexName: string) => {
    if (readOnlyMode) {
      alert('Read-only mode is active. Cannot drop indexes.');
      return;
    }
    if (indexName === '_id_') {
      alert('Cannot drop the default _id_ index in MongoDB.');
      return;
    }
    if (!confirm(`Are you sure you want to drop index "${indexName}"?`)) return;

    try {
      const res = await axios.delete(
        `/api/indexes/${dbName}/${collectionName}/${indexName}`,
        { headers: { 'x-mongo-uri': activeProfile?.uri } }
      );
      if (res.data.success) {
        setMessage({ type: 'success', text: `Index "${indexName}" dropped successfully.` });
        fetchIndexes();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-color)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-[var(--accent-emerald)]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                Schema & Index Inspector
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                {dbName} / <span className="text-[var(--accent-cyan)] font-semibold">{collectionName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-panel)]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('schema')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'schema'
                  ? 'border-[var(--accent-emerald)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Schema Auto-Discovery ({fields.length} fields)
            </button>
            <button
              onClick={() => setActiveTab('indexes')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'indexes'
                  ? 'border-[var(--accent-emerald)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Key className="w-3.5 h-3.5" /> Index Inspector ({indexes.length} indexes)
            </button>
          </div>

          {activeTab === 'schema' && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span>Sample Size:</span>
              <select
                value={sampleSize}
                onChange={(e) => setSampleSize(Number(e.target.value))}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value={50}>50 docs</option>
                <option value={100}>100 docs</option>
                <option value={250}>250 docs</option>
                <option value={500}>500 docs</option>
              </select>
              <button
                onClick={fetchSchema}
                disabled={loadingSchema}
                className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Refresh Schema"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSchema ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`px-6 py-2.5 text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'schema' ? (
            loadingSchema ? (
              <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent-emerald)]" />
                <p className="text-xs">Sampling documents and inferring schema types...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] text-sm">
                No documents found in this collection to infer schema.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-[var(--text-muted)]">
                  Inferred from <span className="font-semibold text-[var(--text-primary)]">{totalSampled}</span> sampled documents:
                </div>
                <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-mono uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Field Path</th>
                        <th className="py-3 px-4">Detected Types</th>
                        <th className="py-3 px-4">Presence Ratio</th>
                        <th className="py-3 px-4">Sample Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {fields.map((f) => (
                        <tr key={f.name} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                            {f.name}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {f.types.map((t) => (
                                <span
                                  key={t}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    TYPE_COLORS[t] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                                  }`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--accent-emerald)] rounded-full"
                                  style={{ width: `${f.presencePercentage}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                                {f.presencePercentage}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--text-muted)] max-w-xs truncate">
                            {typeof f.sampleValue === 'object' ? JSON.stringify(f.sampleValue) : String(f.sampleValue ?? 'null')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {/* Index Creator Form */}
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Create New Index
                </h3>
                <form onSubmit={handleCreateIndex} className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Field name (e.g. email or status)"
                      value={newIndexField}
                      onChange={(e) => setNewIndexField(e.target.value)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono focus:border-[var(--accent-emerald)]"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={newIndexOrder}
                      onChange={(e) => setNewIndexOrder(e.target.value as '1' | '-1')}
                      className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono"
                    >
                      <option value="1">1 (Ascending)</option>
                      <option value="-1">-1 (Descending)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIndexUnique}
                      onChange={(e) => setNewIndexUnique(e.target.checked)}
                      className="rounded accent-[var(--accent-emerald)]"
                    />
                    <span>Unique Constraint</span>
                  </label>
                  <button
                    type="submit"
                    disabled={creatingIndex || !newIndexField.trim() || readOnlyMode}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent-emerald)] text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {creatingIndex ? 'Creating...' : 'Create Index'}
                  </button>
                </form>
              </div>

              {/* Index List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Existing Indexes on Collection</span>
                  <button
                    onClick={fetchIndexes}
                    disabled={loadingIndexes}
                    className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title="Refresh Indexes"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingIndexes ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="grid gap-2">
                  {indexes.map((idx) => (
                    <div
                      key={idx.name}
                      className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                              {idx.name}
                            </span>
                            {idx.unique && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                                UNIQUE
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                            Keys: {JSON.stringify(idx.key)}
                          </div>
                        </div>
                      </div>

                      {idx.name !== '_id_' && !readOnlyMode && (
                        <button
                          onClick={() => handleDropIndex(idx.name)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-rose-400 transition-colors"
                          title="Drop Index"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
