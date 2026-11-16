import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Check,
  Wifi,
  AlertCircle,
  Server,
  X,
  RefreshCw,
  Plug,
  Eye,
  EyeOff,
  Sliders,
  FileCode,
  Shield,
  Layers,
  Copy
} from 'lucide-react';
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
  const [uri, setUri] = useState('mongodb://localhost:27017');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);

  // Connection Builder vs Raw URI tab: 'builder' | 'raw'
  const [connectionMode, setConnectionMode] = useState<'builder' | 'raw'>('builder');

  // Form Builder Fields
  const [scheme, setScheme] = useState<'mongodb' | 'mongodb+srv'>('mongodb');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('27017');
  const [database, setDatabase] = useState('');
  const [authEnabled, setAuthEnabled] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authSource, setAuthSource] = useState('admin');
  const [tls, setTls] = useState(false);
  const [replicaSet, setReplicaSet] = useState('');
  const [directConnection, setDirectConnection] = useState(false);

  // Sync Form Builder -> Raw URI
  useEffect(() => {
    if (connectionMode !== 'builder') return;

    let computed = `${scheme}://`;
    if (authEnabled && username.trim()) {
      const u = encodeURIComponent(username.trim());
      const p = password ? `:${encodeURIComponent(password)}` : '';
      computed += `${u}${p}@`;
    }
    computed += host.trim() || 'localhost';
    if (scheme === 'mongodb' && port.trim()) {
      computed += `:${port.trim()}`;
    }
    computed += '/';
    if (database.trim()) {
      computed += encodeURIComponent(database.trim());
    }

    const params: string[] = [];
    if (authEnabled && authSource.trim() && authSource.trim() !== 'admin') {
      params.push(`authSource=${encodeURIComponent(authSource.trim())}`);
    } else if (authEnabled && database.trim() && authSource.trim() === 'admin') {
      params.push('authSource=admin');
    }
    if (tls || scheme === 'mongodb+srv') {
      params.push('tls=true');
    }
    if (replicaSet.trim()) {
      params.push(`replicaSet=${encodeURIComponent(replicaSet.trim())}`);
    }
    if (directConnection && scheme === 'mongodb') {
      params.push('directConnection=true');
    }

    if (params.length > 0) {
      computed += `?${params.join('&')}`;
    }

    setUri(computed);
  }, [
    connectionMode,
    scheme,
    host,
    port,
    database,
    authEnabled,
    username,
    password,
    authSource,
    tls,
    replicaSet,
    directConnection
  ]);

  const parseRawUriToBuilder = (rawUri: string) => {
    try {
      const isSrv = rawUri.startsWith('mongodb+srv://');
      const isStandard = rawUri.startsWith('mongodb://');
      if (!isSrv && !isStandard) return;

      const s = isSrv ? 'mongodb+srv' : 'mongodb';
      setScheme(s);

      const stripped = rawUri.replace(/^mongodb(\+srv)?:\/\//, '');
      const [authAndHosts, queryStr] = stripped.split('?');
      const [authOrHost, ...dbParts] = authAndHosts.split('/');
      const dbName = dbParts.join('/');

      if (authOrHost.includes('@')) {
        const [credPart, hostPart] = authOrHost.split('@');
        const [u, ...pParts] = credPart.split(':');
        setAuthEnabled(true);
        setUsername(decodeURIComponent(u || ''));
        setPassword(decodeURIComponent(pParts.join(':') || ''));
        const [h, p] = hostPart.split(':');
        setHost(h || 'localhost');
        if (p) setPort(p);
      } else {
        setAuthEnabled(false);
        const [h, p] = authOrHost.split(':');
        setHost(h || 'localhost');
        if (p) setPort(p);
      }

      if (dbName) setDatabase(decodeURIComponent(dbName));

      if (queryStr) {
        const params = new URLSearchParams(queryStr);
        if (params.get('authSource')) setAuthSource(params.get('authSource')!);
        if (params.get('tls') === 'true' || params.get('ssl') === 'true') setTls(true);
        if (params.get('replicaSet')) setReplicaSet(params.get('replicaSet')!);
        if (params.get('directConnection') === 'true') setDirectConnection(true);
      }
    } catch {}
  };

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

  const handleCopyUri = () => {
    navigator.clipboard.writeText(uri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 1500);
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
    const createdProfile = saveProfile(name.trim(), uri.trim(), false);
    await connectProfile(createdProfile);
    setName('');
    setTestResult(null);
    onClose();
  };

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div
        className="db-modal-box max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-[var(--accent-emerald)]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connection Manager</h3>
              <p className="text-xs text-[var(--text-muted)]">Configure local, standalone, or MongoDB Atlas cluster connections</p>
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
              Saved Connection Profiles ({savedProfiles.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
                          className="db-btn db-btn-primary db-text-xs py-1 px-3"
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
          <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Add New MongoDB Connection
              </h4>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-[var(--bg-panel)] p-0.5 rounded-lg border border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('builder');
                    parseRawUriToBuilder(uri);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                    connectionMode === 'builder'
                      ? 'bg-[var(--accent-emerald)] text-slate-950 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Sliders className="w-3 h-3" /> Guided Builder
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMode('raw')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                    connectionMode === 'raw'
                      ? 'bg-[var(--accent-emerald)] text-slate-950 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FileCode className="w-3 h-3" /> Raw URI
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Profile Name</label>
              <input
                type="text"
                placeholder="e.g. Local MongoDB / Production Atlas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
              />
            </div>

            {/* Guided Form Builder Fields */}
            {connectionMode === 'builder' ? (
              <div className="space-y-3 pt-1 border-t border-[var(--border-color)]">
                {/* Protocol / Scheme */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Connection Type</label>
                    <select
                      value={scheme}
                      onChange={(e) => setScheme(e.target.value as any)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
                    >
                      <option value="mongodb">Standard (mongodb://)</option>
                      <option value="mongodb+srv">Atlas SRV (mongodb+srv://)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Database Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. test or mydatabase"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
                    />
                  </div>
                </div>

                {/* Host and Port */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={scheme === 'mongodb+srv' ? 'col-span-3' : 'col-span-2'}>
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Host / Cluster Address</label>
                    <input
                      type="text"
                      placeholder={scheme === 'mongodb+srv' ? 'cluster0.abcde.mongodb.net' : 'localhost'}
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
                    />
                  </div>

                  {scheme === 'mongodb' && (
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Port</label>
                      <input
                        type="text"
                        placeholder="27017"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
                      />
                    </div>
                  )}
                </div>

                {/* Authentication Toggle */}
                <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 cursor-pointer">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enable Authentication (Username / Password)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={authEnabled}
                      onChange={(e) => setAuthEnabled(e.target.checked)}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {authEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Username</label>
                        <input
                          type="text"
                          placeholder="admin"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
                        />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 pr-7 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-6 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] mb-1 block">Auth Source</label>
                        <input
                          type="text"
                          placeholder="admin"
                          value={authSource}
                          onChange={(e) => setAuthSource(e.target.value)}
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-emerald)]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Connection Options */}
                <div className="pt-2 border-t border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={tls || scheme === 'mongodb+srv'}
                      disabled={scheme === 'mongodb+srv'}
                      onChange={(e) => setTls(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>SSL / TLS Encryption</span>
                  </label>

                  {scheme === 'mongodb' && (
                    <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={directConnection}
                        onChange={(e) => setDirectConnection(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>Direct Connection</span>
                    </label>
                  )}
                </div>
              </div>
            ) : (
              /* Raw URI Field */
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">Raw Connection URI</label>
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
            )}

            {/* Live Generated URI Preview */}
            <div className="p-2.5 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                <span>Computed Connection URI</span>
                <button
                  type="button"
                  onClick={handleCopyUri}
                  className="text-emerald-400 hover:underline flex items-center gap-1 normal-case"
                >
                  {copiedUri ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedUri ? 'Copied' : 'Copy URI'}
                </button>
              </div>
              <p className="text-xs font-mono text-[var(--accent-emerald)] break-all select-all">
                {maskUri(uri)}
              </p>
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
                className="db-btn db-btn-secondary db-text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />}
                Test Connection
              </button>

              <button
                type="button"
                onClick={handleSaveAndConnect}
                disabled={!name.trim() || !uri.trim()}
                className="db-btn db-btn-primary db-text-xs py-1.5 px-4 disabled:opacity-50"
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
            className="db-btn db-btn-secondary db-text-xs py-1.5 px-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
