import React, { useState, useEffect } from 'react';
import { Server, X, Activity, Cpu, HardDrive, RefreshCw, Layers, AlertCircle } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface ServerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerStatusModal: React.FC<ServerStatusModalProps> = ({ isOpen, onClose }) => {
  const { activeProfile } = useConnection();
  const [status, setStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeProfile) {
      fetchStatus();
    }
  }, [isOpen, activeProfile]);

  const fetchStatus = async () => {
    if (!activeProfile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/server/status', {
        headers: { 'x-mongo-uri': activeProfile.uri }
      });
      if (res.data.success) {
        setStatus(res.data.serverStatus);
      } else {
        setError(res.data.error || 'Diagnostic inspection failed.');
      }
    } catch (err: any) {
      console.error('Error fetching server status:', err);
      setError(err.response?.data?.error || err.message || 'Unable to fetch server status. Cluster administrative role required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal-box animate-fade-in db-flex db-flex-col" onClick={(e) => e.stopPropagation()}>
      
        <div className="db-modal-header">
          <div className="db-row-start">
            <Server className="db-icon-sm db-icon-emerald" />
            <h3 className="db-text-sm db-font-bold db-text-primary">Live MongoDB Server Diagnostics</h3>
          </div>
          <div className="db-row-end">
            <button onClick={fetchStatus} className="db-btn db-btn-secondary db-p-1">
              <RefreshCw className={`db-icon-sm ${loading ? 'animate-spin db-icon-emerald' : ''}`} />
            </button>
            <button onClick={onClose} className="db-btn db-btn-secondary db-p-1">
              <X className="db-icon-sm" />
            </button>
          </div>
        </div>

        <div className="db-modal-body db-space-y-4">
          {loading && !status ? (
            <div className="db-p-6 db-text-center db-text-xs db-text-muted">Loading server diagnostics...</div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Server Diagnostics Unavailable
              </div>
              <p className="text-[11px] leading-relaxed text-amber-300/80">
                {error}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Note: MongoDB administrative commands require elevated privileges (e.g. clusterMonitor role) which may be restricted on shared clusters like MongoDB Atlas M0.
              </p>
            </div>
          ) : status ? (
            <>
              <div className="db-grid-2">
                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">Server Host</span>
                  <p className="db-metric-val-emerald">{status.host || 'localhost'}</p>
                </div>
                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">MongoDB Version</span>
                  <p className="db-metric-val-emerald">v{status.version || '7.0'}</p>
                </div>
                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">Uptime</span>
                  <p className="db-metric-val-cyan">{formatUptime(status.uptime)}</p>
                </div>
                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">Current Connections</span>
                  <p className="db-metric-val-purple">{status.connections?.current || 1}</p>
                </div>
              </div>

              {/* OpCounters */}
              {status.opcounters && (
                <div className="db-card-box db-space-y-2">
                  <h4 className="db-text-xs db-font-semibold db-text-secondary db-row-start">
                    <Activity className="db-icon-sm db-icon-emerald" /> Server Operations Counter (OpCounters)
                  </h4>
                  <div className="db-grid-2 db-text-center">
                    <div className="db-card-box">
                      <span className="db-stat-label">Inserts</span>
                      <span className="db-metric-val-emerald">{status.opcounters.insert?.toLocaleString() || 0}</span>
                    </div>
                    <div className="db-card-box">
                      <span className="db-stat-label">Queries</span>
                      <span className="db-metric-val-cyan">{status.opcounters.query?.toLocaleString() || 0}</span>
                    </div>
                    <div className="db-card-box">
                      <span className="db-stat-label">Updates</span>
                      <span className="db-metric-val-amber">{status.opcounters.update?.toLocaleString() || 0}</span>
                    </div>
                    <div className="db-card-box">
                      <span className="db-stat-label">Deletes</span>
                      <span className="db-text-rose db-font-mono db-font-bold">{status.opcounters.delete?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
