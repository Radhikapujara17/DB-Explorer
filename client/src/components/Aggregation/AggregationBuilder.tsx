import React, { useState } from 'react';
import { Layers, Play, Plus, Trash2, BarChart2, Eye, Code2, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useConnection } from '../../context/ConnectionContext';
import axios from 'axios';

const STAGE_TEMPLATES: Record<string, string> = {
  $match: '{\n  "$match": {\n    "status": "active"\n  }\n}',
  $group: '{\n  "$group": {\n    "_id": "$role",\n    "totalCount": { "$sum": 1 },\n    "avgSpend": { "$avg": "$totalSpend" }\n  }\n}',
  $project: '{\n  "$project": {\n    "name": 1,\n    "email": 1,\n    "totalSpend": 1\n  }\n}',
  $sort: '{\n  "$sort": {\n    "totalSpend": -1\n  }\n}',
  $lookup: '{\n  "$lookup": {\n    "from": "orders",\n    "localField": "_id",\n    "foreignField": "userId",\n    "as": "userOrders"\n  }\n}',
  $unwind: '{\n  "$unwind": "$items"\n}',
  $limit: '{\n  "$limit": 10\n}'
};

export const AggregationBuilder: React.FC = () => {
  const { activeProfile, selectedDb, selectedCollection } = useConnection();

  const [stages, setStages] = useState<string[]>([
    STAGE_TEMPLATES.$match,
    STAGE_TEMPLATES.$group
  ]);

  const [executing, setExecuting] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [stagePreviews, setStagePreviews] = useState<any[]>([]);
  const [finalResult, setFinalResult] = useState<any[]>([]);
  const [activeStageTab, setActiveStageTab] = useState<number>(0);
  const [showChart, setShowChart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAddStage = (stageType: string) => {
    setStages(prev => [...prev, STAGE_TEMPLATES[stageType] || '{\n  \n}']);
  };

  const handleRemoveStage = (index: number) => {
    setStages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateStage = (index: number, val: string) => {
    setStages(prev => prev.map((s, i) => i === index ? val : s));
  };

  const handleExecute = async () => {
    if (!activeProfile || !selectedDb || !selectedCollection) return;
    setError(null);
    setExecuting(true);

    try {
      const parsedPipeline = stages.map(s => {
        try {
          return JSON.parse(s);
        } catch (e: any) {
          throw new Error(`Syntax error in Stage ${stages.indexOf(s) + 1}: ${e.message}`);
        }
      });

      const res = await axios.post(
        `/api/aggregation/${selectedDb}/${selectedCollection}/execute`,
        { pipeline: parsedPipeline },
        { headers: { 'x-mongo-uri': activeProfile.uri } }
      );

      if (res.data.success) {
        setStagePreviews(res.data.stagePreviews || []);
        setFinalResult(res.data.finalResult || []);
        setExecutionTimeMs(res.data.executionTimeMs);
        setActiveStageTab(res.data.stagePreviews.length - 1);
      } else {
        setError(res.data.error || 'Aggregation execution failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  // Derive numeric chart data from final aggregated result if available
  const chartData = finalResult.map((item, idx) => {
    const label = item._id !== undefined && item._id !== null
      ? typeof item._id === 'object' ? JSON.stringify(item._id) : String(item._id)
      : `Item ${idx + 1}`;

    const numKey = Object.keys(item).find(k => k !== '_id' && typeof item[k] === 'number');
    const value = numKey ? item[numKey] : 0;

    return { label, value, metricName: numKey || 'Count' };
  });

  return (
    <div className="db-content-pane">
      {/* Top Header & Stage Palette */}
      <div className="db-toolbar">
        <div className="db-row-start">
          <Layers className="db-icon-sm db-icon-purple" />
          <h2 className="db-text-sm db-font-bold db-text-primary">Aggregation Pipeline Visualizer</h2>
        </div>

        <div className="db-row-end">
          <span className="db-text-xs db-text-muted">Add Stage:</span>
          {Object.keys(STAGE_TEMPLATES).map(type => (
            <button
              key={type}
              onClick={() => handleAddStage(type)}
              className="db-badge db-badge-purple db-cursor-pointer"
            >
              +{type}
            </button>
          ))}

          <div className="db-header-divider" />

          {executionTimeMs !== null && (
            <span className="db-badge db-badge-green db-font-mono">
              <Clock className="db-icon-xs" /> {executionTimeMs} ms
            </span>
          )}

          <button
            onClick={handleExecute}
            disabled={executing || stages.length === 0}
            className="db-btn db-btn-ai db-text-xs"
          >
            {executing ? (
              <span>Running Pipeline...</span>
            ) : (
              <>
                <Play className="db-icon-xs fill-current" />
                <span>Execute Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split: Left Stage Code Editors, Right Stage Inspector */}
      <div className="db-grid-2 db-flex-1 db-overflow-hidden">
        {/* Left: Stage Constructor Cards */}
        <div className="db-p-3 db-overflow-auto db-space-y-3 db-border-r db-bg-panel">
          {stages.length === 0 && (
            <div className="db-p-6 db-text-center db-text-xs db-text-muted">
              No aggregation stages added. Click +$match or +$group above to construct pipeline.
            </div>
          )}

          {stages.map((stageStr, idx) => (
            <div key={idx} className="db-card-box db-overflow-hidden">
              <div className="db-row-start db-justify-between db-border-b db-py-1">
                <span className="db-text-xs db-font-mono db-font-semibold db-text-purple db-row-start">
                  <span className="db-badge db-badge-purple">
                    {idx + 1}
                  </span>
                  Stage {idx + 1}
                </span>

                <button
                  onClick={() => handleRemoveStage(idx)}
                  className="db-btn db-btn-danger db-p-1"
                  title="Remove Stage"
                >
                  <Trash2 className="db-icon-xs" />
                </button>
              </div>

              <div className="db-full-h">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={stageStr}
                  onChange={(v) => handleUpdateStage(idx, v || '')}
                  options={{ minimap: { enabled: false }, fontSize: 12, fontFamily: 'Fira Code', lineNumbers: 'off' }}
                />
              </div>
            </div>
          ))}

          {error && (
            <div className="db-alert-box">
              {error}
            </div>
          )}
        </div>

        {/* Right: Live Stage Inspector & Insights Chart */}
        <div className="db-flex db-flex-col db-full-h db-overflow-hidden db-bg-dark">
          {/* Stage Tabs */}
          <div className="db-toolbar">
            <span className="db-text-xs db-font-semibold db-text-muted db-row-start">
              <Eye className="db-icon-xs db-icon-cyan" /> Stage Inspector:
            </span>

            {stagePreviews.map((preview, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStageTab(idx)}
                className={`db-sub-header-btn ${
                  activeStageTab === idx ? 'active-purple' : ''
                }`}
              >
                <span>Stage {idx + 1}</span>
                <span className="db-badge db-badge-cyan">{preview.count} docs</span>
              </button>
            ))}
          </div>

          {/* Visual Bar Chart for Group Stage Insights */}
          {chartData.length > 0 && showChart && (
            <div className="db-card-box db-p-3 db-border-b">
              <div className="db-row-start db-justify-between db-py-1">
                <h4 className="db-text-xs db-font-semibold db-text-purple db-row-start">
                  <BarChart2 className="db-icon-xs db-icon-purple" /> Aggregation Visual Distribution
                </h4>
                <button
                  onClick={() => setShowChart(false)}
                  className="db-btn db-btn-secondary db-text-xs"
                >
                  Hide Chart
                </button>
              </div>
              <div className="db-full-w">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Documents Output Viewer for Active Stage Tab */}
          <div className="db-flex-1 db-p-3 db-overflow-auto">
            {stagePreviews.length === 0 ? (
              <div className="db-full-h db-flex db-items-center db-justify-center db-text-xs db-text-muted">
                Execute pipeline to inspect output documents step-by-step.
              </div>
            ) : (
              <div className="db-space-y-2">
                <div className="db-text-xs db-font-mono db-text-muted db-row-start db-justify-between">
                  <span>
                    Output for <strong>Stage {activeStageTab + 1}</strong> ({stagePreviews[activeStageTab]?.stageName}):
                  </span>
                  <span className="db-text-cyan">{stagePreviews[activeStageTab]?.count} sample docs</span>
                </div>

                <div className="db-card-box db-font-mono db-text-xs db-overflow-auto db-text-emerald">
                  <pre>{JSON.stringify(stagePreviews[activeStageTab]?.sampleDocs, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
