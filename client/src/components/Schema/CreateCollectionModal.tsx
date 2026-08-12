import React, { useState } from 'react';
import { FolderPlus, X, Plus, AlertCircle } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { activeProfile, selectedDb, readOnlyMode } = useConnection();
  const [collectionName, setCollectionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (readOnlyMode) {
      setError('Read-Only Mode active. Cannot create collection.');
      return;
    }
    if (!collectionName.trim() || !selectedDb || !activeProfile) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `/api/collections/${selectedDb}/create`,
        { collectionName: collectionName.trim() },
        { headers: { 'x-mongo-uri': activeProfile.uri } }
      );
      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.error || 'Failed to create collection');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box animate-fade-in db-flex db-flex-col">
        <div className="db-modal-header">
          <div className="db-row-start">
            <FolderPlus className="db-icon-sm db-icon-emerald" />
            <h3 className="db-text-sm db-font-bold db-text-primary">Create New Collection</h3>
          </div>
          <button onClick={onClose} className="db-btn db-btn-secondary db-p-1">
            <X className="db-icon-sm" />
          </button>
        </div>

        <div className="db-modal-body db-space-y-4">
          <div>
            <label className="db-text-xs db-font-semibold db-text-secondary db-py-1 db-full-w">
              Target Database: <span className="db-text-emerald db-font-mono">{selectedDb}</span>
            </label>
            <input
              type="text"
              placeholder="Collection name (e.g. audit_logs)"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="db-input db-input-mono db-full-w db-text-xs"
            />
          </div>

          {error && (
            <div className="db-alert-box">
              <AlertCircle className="db-icon-sm" />
              <span>{error}</span>
            </div>
          )}

          <div className="db-row-end db-py-2">
            <button onClick={onClose} className="db-btn db-btn-secondary db-text-xs">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={loading || !collectionName.trim() || readOnlyMode}
              className="db-btn db-btn-primary db-text-xs"
            >
              {loading ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
