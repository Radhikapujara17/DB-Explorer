import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Check, Wifi, AlertCircle, Server, X } from 'lucide-react';
import { useConnection, SavedProfile } from '../../context/ConnectionContext';

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
  };

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box animate-fade-in">
        {/* Header */}
        <div className="db-modal-header">
          <div className="db-row-start">
            <Server className="db-icon db-icon-emerald" />
            <h3 className="db-text-sm db-font-bold db-text-primary">Manage Connection Profiles</h3>
          </div>

          <div className="db-row-end">
            <button onClick={onClose} className="db-esc-label" title="Press Escape to Close">
              <span className="db-key-badge">ESC</span> Close
            </button>
            <button onClick={onClose} className="db-btn db-btn-secondary p-1">
              <X className="db-icon-sm" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="db-modal-body space-y-4">
          <div className="space-y-2">
            <label className="db-text-xs db-font-semibold db-text-muted">Saved Connections</label>
            {savedProfiles.map(prof => {
              const isActive = activeProfile?.id === prof.id;
              return (
                <div
                  key={prof.id}
                  className={`p-3 rounded-xl border db-row-start db-justify-between transition ${
                    isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="db-row-start db-truncate-md">
                    <Database className={`db-icon-sm ${isActive ? 'db-icon-emerald' : 'db-icon-muted'}`} />
                    <div>
                      <h4 className="db-text-xs db-font-bold db-text-primary">{prof.name}</h4>
                      <p className="db-text-micro db-truncate-sm">{prof.uri}</p>
                    </div>
                  </div>

                  <div className="db-row-end">
                    {isActive ? (
                      <span className="db-badge db-badge-green">
                        <Check className="db-icon-xs mr-1" /> Active ({connectionLatency || 0}ms)
                      </span>
                    ) : (
                      <button
                        onClick={() => connectProfile(prof)}
                        className="db-btn db-btn-secondary db-text-xs py-1"
                      >
                        Connect
                      </button>
                    )}

                    <button
                      onClick={() => deleteProfile(prof.id)}
                      disabled={savedProfiles.length === 1}
                      className="db-btn db-btn-secondary p-1.5 db-text-rose"
                      title="Delete Profile"
                    >
                      <Trash2 className="db-icon-xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="db-text-xs db-font-bold db-text-primary db-row-start">
              <Plus className="db-icon-sm db-icon-emerald" /> Add Connection URI
            </h4>

            <div>
              <label className="db-text-xs db-text-muted mb-1 block">Connection Name</label>
              <input
                type="text"
                placeholder="Local Mongo / Atlas Cluster"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="db-input db-text-xs db-full-w"
              />
            </div>

            <div>
              <label className="db-text-xs db-text-muted mb-1 block">MongoDB Connection String URI</label>
              <input
                type="text"
                placeholder="mongodb://localhost:27017 or mongodb+srv://..."
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                className="db-input db-input-mono db-text-xs db-full-w"
              />
            </div>

            <div className="db-row-start db-justify-end pt-2">
              <button
                onClick={handleSaveAndConnect}
                disabled={!name.trim() || !uri.trim()}
                className="db-btn db-btn-primary db-text-xs"
              >
                Save & Connect Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
