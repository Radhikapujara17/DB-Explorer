import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Check, Wifi, AlertCircle, Server, X, RefreshCw, Plug } from 'lucide-react';
import { useConnection, SavedProfile } from '../../context/ConnectionContext';
import axios from 'axios';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const {
    savedProfiles,
    activeProfile,
    saveProfile,
    deleteProfile,
    connectProfile,
    connectionLatency
  } = useConnection();

  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maskUri = (rawUri: string) => {
    return rawUri.replace(/:\/\/[^:]+:([^@]+)@/, '://***:***@');
  };

  const handleTestConnection = async () => {
    if (!uri.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post('/api/connect/test', { connectionUri: uri.trim() });
      if (res.data.success) {
        setTestResult({ success: true, latencyMs: res.data.latencyMs });
      } else {
        setTestResult({ success: false, error: res.data.error || 'Connection failed' });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.response?.data?.error || err.message || 'Connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndConnect = async () => {
    if (!name.trim() || !uri.trim()) return;
    saveProfile(name.trim(), uri.trim(), false);
    const newProf: SavedProfile = {
      id: Date.now().toString(),
      name: name.trim(),
      uri: uri.trim(),
      isReadOnly: false
    };
    await connectProfile(newProf);
    setName('');
    setUri('');
    setTestResult(null);
    onClose();
  };

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-color)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-[var(--accent-emerald)]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connection Manager</h3>
              <p className="text-xs text-[var(--text-muted)]">Configure local or MongoDB Atlas connections</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Saved Profiles */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              Saved Connection Profiles
            </label>
            <div className="space-y-2">
              {savedProfiles.map((prof) => {
                const isActive = activeProfile?.id === prof.id;
                return (
                  <div
                    key={prof.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-emerald)]/10 border-[var(--accent-emerald)]/40'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)]' : 'bg-white/5 text-[var(--text-muted)]'
                      }`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{prof.name}</h4>
                        <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">{maskUri(prof.uri)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isActive ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Connected ({connectionLatency ?? 0}ms)
                        </span>
                      ) : (
                        <button
                          onClick={() => connectProfile(prof)}
                          className="px-3 py-1 rounded-lg bg-[var(--accent-emerald)] text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Connect
                        </button>
                      )}

                      {savedProfiles.length > 1 && (
                        <button
                          onClick={() => deleteProfile(prof.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Connection Form */}
          <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] space-y-3.5">
            <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Add New MongoDB Connection
            </h4>

            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Profile Name</label>
              <input
                type="text"
                placeholder="e.g. Local Development / Atlas Production"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Connection URI</label>
              <input
                type="text"
                placeholder="mongodb://localhost:27017 or mongodb+srv://..."
                value={uri}
                onChange={(e) => {
                  setUri(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
              />
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>
                  {testResult.success
                    ? `Connection successful! Latency: ${testResult.latencyMs}ms`
                    : `Connection failed: ${testResult.error}`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !uri.trim()}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-white/5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />}
                Test Connection
              </button>

              <button
                onClick={handleSaveAndConnect}
                disabled={!name.trim() || !uri.trim()}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-emerald)] text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save & Connect Profile
              </button>
            </div>
          </div>
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
