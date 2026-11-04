import React, { useState, useEffect } from 'react';
import { Filter, Play, Plus, Trash2, SlidersHorizontal, Code2, Clock, AlertTriangle, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import Editor from '@monaco-editor/react';

export interface VisualRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface QueryBuilderProps {
  onExecuteQuery: (queryObj: { filter: any; projection?: any; sort?: any }) => void;
  schemaFields?: string[];
  executionTimeMs?: number | null;
  loading?: boolean;
}

const OPERATORS = [
  { label: 'Equals ($eq)', value: '$eq' },
  { label: 'Not Equals ($ne)', value: '$ne' },
  { label: 'Greater Than ($gt)', value: '$gt' },
  { label: 'Greater Than or Equal ($gte)', value: '$gte' },
  { label: 'Less Than ($lt)', value: '$lt' },
  { label: 'Less Than or Equal ($lte)', value: '$lte' },
  { label: 'Contains / Regex ($regex)', value: '$regex' },
  { label: 'In Array ($in)', value: '$in' },
  { label: 'Exists ($exists)', value: '$exists' }
];

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  onExecuteQuery,
  schemaFields = [],
  executionTimeMs,
  loading
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');

  const [rules, setRules] = useState<VisualRule[]>([
    { id: '1', field: '', operator: '$eq', value: '' }
  ]);

  const [filterJson, setFilterJson] = useState('{}');
  const [projectionJson, setProjectionJson] = useState('{}');
  const [sortJson, setSortJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'visual') {
      const compiledFilter: Record<string, any> = {};
      rules.forEach(rule => {
        if (!rule.field.trim()) return;

        let val: any = rule.value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(Number(val)) && val.trim() !== '') val = Number(val);
        else if (rule.operator === '$in') {
          val = val.split(',').map((s: string) => s.trim());
        } else if (rule.operator === '$exists') {
          val = val !== 'false';
        }

        if (rule.operator === '$eq') {
          compiledFilter[rule.field] = val;
        } else {
          compiledFilter[rule.field] = { [rule.operator]: val };
        }
      });

      setFilterJson(JSON.stringify(compiledFilter, null, 2));
    }
  }, [rules, activeTab]);

  const handleAddRule = () => {
    setRules(prev => [...prev, { id: Date.now().toString(), field: '', operator: '$eq', value: '' }]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateRule = (id: string, key: keyof VisualRule, val: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  };

  const handleRun = () => {
    setJsonError(null);
    try {
      const filter = filterJson.trim() ? JSON.parse(filterJson) : {};
      const projection = projectionJson.trim() ? JSON.parse(projectionJson) : {};
      const sort = sortJson.trim() ? JSON.parse(sortJson) : {};

      onExecuteQuery({ filter, projection, sort });
    } catch (err: any) {
      setJsonError(`Query JSON Error: ${err.message}`);
    }
  };

  return (
    <div className="db-query-panel">
      {/* Header controls */}
      <div className="db-responsive-bar">
        <div className="db-row-start">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="db-btn db-btn-secondary"
            title={collapsed ? 'Expand Query Builder' : 'Collapse Query Builder'}
          >
            {collapsed ? <ChevronDown className="db-icon-sm db-icon-emerald" /> : <ChevronUp className="db-icon-sm db-icon-emerald" />}
          </button>

          <div className="db-pill-switcher">
            <button
              onClick={() => { setActiveTab('visual'); setCollapsed(false); }}
              className={`db-pill-btn ${activeTab === 'visual' ? 'active' : ''}`}
            >
              <SlidersHorizontal className="db-icon-xs" /> Visual Filter Builder
            </button>

            <button
              onClick={() => { setActiveTab('code'); setCollapsed(false); }}
              className={`db-pill-btn ${activeTab === 'code' ? 'active' : ''}`}
            >
              <Code2 className="db-icon-xs" /> Raw Mongo Query
            </button>
          </div>
        </div>

        <div className="db-row-end">
          {executionTimeMs !== undefined && executionTimeMs !== null && (
            <span className="db-badge db-badge-green db-font-mono">
              <Clock className="db-icon-xs" /> {executionTimeMs} ms
            </span>
          )}

          <button
            onClick={handleRun}
            disabled={loading}
            className="db-btn db-btn-primary db-text-xs"
          >
            {loading ? (
              <RefreshCw className="db-icon-xs animate-spin" />
            ) : (
              <Play className="db-icon-xs fill-current" />
            )}
            <span>{loading ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Panel */}
      {!collapsed && (
        <div>
          {activeTab === 'visual' ? (
            <div className="db-space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="db-rule-row">
                  <input
                    type="text"
                    list={`fields-${rule.id}`}
                    placeholder="Field name (e.g. status)"
                    value={rule.field}
                    onChange={(e) => handleUpdateRule(rule.id, 'field', e.target.value)}
                    className="db-input db-input-mono db-text-xs db-flex-1"
                  />
                  {schemaFields.length > 0 && (
                    <datalist id={`fields-${rule.id}`}>
                      {schemaFields.map(f => (
                        <option key={f} value={f} />
                      ))}
                    </datalist>
                  )}

                  <select
                    value={rule.operator}
                    onChange={(e) => handleUpdateRule(rule.id, 'operator', e.target.value)}
                    className="db-input db-text-xs db-font-mono db-text-cyan"
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder={rule.operator === '$in' ? 'val1, val2, val3' : 'Value'}
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(rule.id, 'value', e.target.value)}
                    className="db-input db-input-mono db-text-xs db-flex-1"
                  />

                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    disabled={rules.length === 1}
                    className="db-btn db-btn-danger db-p-1"
                  >
                    <Trash2 className="db-icon-xs" />
                  </button>
                </div>
              ))}

              <div className="db-row-start db-justify-between db-py-1">
                <button
                  onClick={handleAddRule}
                  className="db-btn db-btn-secondary db-text-xs db-text-emerald"
                >
                  <Plus className="db-icon-xs" /> Add Condition
                </button>

                {schemaFields.length > 0 && (
                  <div className="db-row-start db-text-xs db-text-muted">
                    <span>Quick fields:</span>
                    {schemaFields.slice(0, 4).map(f => (
                      <button
                        key={f}
                        onClick={() => handleUpdateRule(rules[0].id, 'field', f)}
                        className="db-btn db-btn-secondary db-text-xs db-font-mono"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="db-grid-2">
              <div className="db-card-box db-flex db-flex-col">
                <span className="db-text-xs db-font-mono db-font-bold db-text-emerald db-py-1">
                  Filter &#123;...&#125;
                </span>
                <div className="db-flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={filterJson}
                    onChange={(v) => setFilterJson(v || '{}')}
                    options={{ minimap: { enabled: false }, fontSize: 12, fontFamily: 'Fira Code', lineNumbers: 'off' }}
                  />
                </div>
              </div>

              <div className="db-card-box db-flex db-flex-col">
                <span className="db-text-xs db-font-mono db-font-bold db-text-cyan db-py-1">
                  Projection &#123;...&#125;
                </span>
                <div className="db-flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={projectionJson}
                    onChange={(v) => setProjectionJson(v || '{}')}
                    options={{ minimap: { enabled: false }, fontSize: 12, fontFamily: 'Fira Code', lineNumbers: 'off' }}
                  />
                </div>
              </div>

              <div className="db-card-box db-flex db-flex-col">
                <span className="db-text-xs db-font-mono db-font-bold db-text-purple db-py-1">
                  Sort &#123;...&#125;
                </span>
                <div className="db-flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={sortJson}
                    onChange={(v) => setSortJson(v || '{}')}
                    options={{ minimap: { enabled: false }, fontSize: 12, fontFamily: 'Fira Code', lineNumbers: 'off' }}
                  />
                </div>
              </div>
            </div>
          )}

          {jsonError && (
            <div className="db-alert-box">
              <AlertTriangle className="db-icon-sm" />
              <span>{jsonError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
