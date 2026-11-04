import React, { useState, useEffect } from 'react';
import { Activity, X, AlertTriangle, CheckCircle2, Clock, Eye, Layers } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

interface ExplainPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryFilter: any;
}

export const ExplainPlanModal: React.FC<ExplainPlanModalProps> = ({
  isOpen,
  onClose,
  queryFilter
}) => {
  const { activeProfile, selectedDb, selectedCollection } = useConnection();
  const [explainPlan, setExplainPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeProfile && selectedDb && selectedCollection) {
      fetchExplain();
    }
  }, [isOpen, queryFilter]);

  const fetchExplain = async () => {
    if (!activeProfile || !selectedDb || !selectedCollection) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `/api/documents/${selectedDb}/${selectedCollection}/explain`,
        { filter: queryFilter },
        { headers: { 'x-mongo-uri': activeProfile.uri } }
      );
      if (res.data.success) {
        setExplainPlan(res.data.explainPlan);
      } else {
        setError(res.data.error || 'Failed to generate explain plan');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Explain failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stats = explainPlan?.executionStats;
  const stage = stats?.executionStages?.stage || stats?.executionStages?.inputStage?.stage || 'UNKNOWN';
  const isFullScan = stage === 'COLLSCAN';

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box animate-fade-in db-flex db-flex-col">
        {/* Header */}
        <div className="db-modal-header">
          <div className="db-row-start">
            <Activity className="db-icon-sm db-icon-emerald" />
            <h3 className="db-text-sm db-font-bold db-text-primary">
              Query Execution Plan Inspector (<span className="db-text-emerald db-font-mono">explainStats</span>)
            </h3>
          </div>
          <button onClick={onClose} className="db-btn db-btn-secondary db-p-1">
            <X className="db-icon-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="db-modal-body db-space-y-4">
          {loading ? (
            <div className="db-p-6 db-text-center db-text-xs db-text-muted db-row-start db-justify-center">
              <Activity className="db-icon-sm animate-spin db-icon-emerald" />
              <span>Analyzing query plan statistics...</span>
            </div>
          ) : error ? (
            <div className="db-alert-box">
              {error}
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="db-grid-2">
                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">Stage Type</span>
                  <div className="db-py-1">
                    {isFullScan ? (
                      <span className="db-badge db-badge-rose db-font-mono">
                        <AlertTriangle className="db-icon-xs" /> COLLSCAN
                      </span>
                    ) : (
                      <span className="db-badge db-badge-green db-font-mono">
                        <CheckCircle2 className="db-icon-xs" /> {stage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">Execution Time</span>
                  <p className="db-metric-val-emerald">
                    {stats?.executionTimeMillis ?? 0} ms
                  </p>
                </div>

                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">Docs Examined</span>
                  <p className="db-metric-val-cyan">
                    {(stats?.totalDocsExamined ?? 0).toLocaleString()}
                  </p>
                </div>

                <div className="db-card-box db-text-center">
                  <span className="db-stat-label">Keys Examined</span>
                  <p className="db-metric-val-purple">
                    {(stats?.totalKeysExamined ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Warning box if full collection scan */}
              {isFullScan && (
                <div className="db-alert-box">
                  <AlertTriangle className="db-icon-sm db-icon-amber" />
                  <div>
                    <span className="db-font-bold">Performance Warning: Full Collection Scan Detected!</span>
                    <p className="db-text-xs db-py-1">
                      This query scanned all {stats?.totalDocsExamined} documents without using an index. Consider creating an index on the filtered fields to improve response time.
                    </p>
                  </div>
                </div>
              )}

              {/* Raw JSON explain output */}
              <div className="db-card-box db-overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={JSON.stringify(explainPlan, null, 2)}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, fontFamily: 'Fira Code' }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
