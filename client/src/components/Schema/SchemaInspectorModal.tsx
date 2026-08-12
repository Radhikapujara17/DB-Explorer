import React, { useState, useEffect } from 'react';
import { X, Layers, Database, Key, Check, Info, HardDrive, RefreshCw } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface SchemaInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaInspectorModal: React.FC<SchemaInspectorModalProps> = ({ isOpen, onClose }) => {
  const { activeProfile, selectedDb, selectedCollection } = useConnection();

  const [activeTab, setActiveTab] = useState<'schema' | 'indexes'>('schema');
  const [fields, setFields] = useState<any[]>([]);
  const [indexes, setIndexes] = useState<any[]>([]);
  const [totalSampled, setTotalSampled] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeProfile && selectedDb && selectedCollection) {
      fetchData();
    }
  }, [isOpen, selectedDb, selectedCollection]);

  const fetchData = async () => {
    if (!activeProfile || !selectedDb || !selectedCollection) return;
    setLoading(true);
    try {
      const [schemaRes, indexRes] = await Promise.all([
        axios.get(`/api/schema/${selectedDb}/${selectedCollection}/infer`, {
          headers: { 'x-mongo-uri': activeProfile.uri }
        }),
        axios.get(`/api/indexes/${selectedDb}/${selectedCollection}`, {
          headers: { 'x-mongo-uri': activeProfile.uri }
        })
      ]);

      if (schemaRes.data.success) {
        setFields(schemaRes.data.fields || []);
        setTotalSampled(schemaRes.data.totalSampled || 0);
      }
      if (indexRes.data.success) {
        setIndexes(indexRes.data.indexes || []);
      }
    } catch (err) {
      console.error('Error fetching schema/indexes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box animate-fade-in db-flex db-flex-col">
        {/* Header */}
        <div className="db-modal-header">
          <div className="db-row-start">
            <div className="db-logo-icon">
              <Layers className="db-icon-sm db-icon-cyan" />
            </div>
            <div>
              <h3 className="db-text-sm db-font-bold db-text-primary">
                Schema & Index Inspector — <span className="db-text-cyan db-font-mono">{selectedCollection}</span>
              </h3>
              <p className="db-text-xs db-text-muted">Sampled top {totalSampled} documents to derive schema definitions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="db-btn db-btn-secondary db-p-1"
          >
            <X className="db-icon-sm" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="db-sub-header">
          <div className="db-row-start">
            <button
              onClick={() => setActiveTab('schema')}
              className={`db-sub-header-btn ${
                activeTab === 'schema' ? 'active-emerald' : ''
              }`}
            >
              Schema Fields ({fields.length})
            </button>
            <button
              onClick={() => setActiveTab('indexes')}
              className={`db-sub-header-btn ${
                activeTab === 'indexes' ? 'active-purple' : ''
              }`}
            >
              Indexes ({indexes.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            className="db-btn db-btn-secondary db-text-xs"
          >
            <RefreshCw className={`db-icon-xs ${loading ? 'animate-spin' : ''}`} />
            <span>Re-analyze</span>
          </button>
        </div>

        {/* Content */}
        <div className="db-modal-body db-space-y-4">
          {loading ? (
            <div className="db-p-6 db-text-center db-text-xs db-text-muted db-row-start db-justify-center">
              <RefreshCw className="db-icon-sm animate-spin db-icon-cyan" />
              <span>Analyzing collection schema structure...</span>
            </div>
          ) : activeTab === 'schema' ? (
            <div className="db-space-y-2">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className="db-card-box db-row-start db-justify-between"
                >
                  <span className="db-font-mono db-font-semibold db-text-primary">
                    {field.name}
                  </span>

                  <div className="db-row-start">
                    {field.types.map((t: string) => (
                      <span
                        key={t}
                        className={`db-badge ${
                          t === 'ObjectId' ? 'db-badge-purple' :
                          t === 'Date' ? 'db-badge-amber' :
                          t === 'Array' ? 'db-badge-cyan' : 'db-badge-green'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <span className="db-text-xs db-font-mono db-text-muted">{field.presencePercentage}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="db-space-y-3">
              {indexes.map((idx, index) => (
                <div key={index} className="db-card-box db-space-y-2">
                  <div className="db-row-start db-justify-between">
                    <span className="db-font-mono db-text-xs db-font-semibold db-text-cyan db-row-start">
                      <Key className="db-icon-xs db-icon-cyan" />
                      {idx.name}
                    </span>
                    {idx.unique && (
                      <span className="db-badge db-badge-amber">Unique</span>
                    )}
                  </div>

                  <div className="db-text-xs db-font-mono db-card-box db-p-2">
                    <pre>{JSON.stringify(idx.key, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
