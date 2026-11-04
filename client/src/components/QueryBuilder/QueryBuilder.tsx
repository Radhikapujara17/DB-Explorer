import React, { useState, useEffect } from 'react';
import { Filter, Play, Plus, Trash2, SlidersHorizontal, Code2, Clock, AlertTriangle, RefreshCw, ChevronDown, Table as TableIcon, X, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useConnection } from '../../context/ConnectionContext';

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
  { label: 'Contains / Regex ($regex)', value: '$regex' },
  { label: 'Equals ($eq)', value: '$eq' },
  { label: 'Not Equals ($ne)', value: '$ne' },
  { label: 'Greater Than ($gt)', value: '$gt' },
  { label: 'Greater Than or Equal ($gte)', value: '$gte' },
  { label: 'Less Than ($lt)', value: '$lt' },
  { label: 'Less Than or Equal ($lte)', value: '$lte' },
  { label: 'In Array ($in)', value: '$in' },
  { label: 'Exists ($exists)', value: '$exists' }
];

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  onExecuteQuery,
  schemaFields = [],
  executionTimeMs,
  loading
}) => {
  const { theme, selectedCollection } = useConnection();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'options'>('visual');

  const [filterInput, setFilterInput] = useState('');
  const [rules, setRules] = useState<VisualRule[]>([
    { id: '1', field: '', operator: '$regex', value: '' }
  ]);

  const [filterJson, setFilterJson] = useState('{}');
  const [projectionJson, setProjectionJson] = useState('{}');
  const [sortJson, setSortJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Reset query inputs when selected collection changes
  useEffect(() => {
    setFilterInput('');
    setFilterJson('{}');
    setProjectionJson('{}');
    setSortJson('{}');
    setJsonError(null);
    setRules([{ id: '1', field: '', operator: '$regex', value: '' }]);
  }, [selectedCollection]);

  // Synchronize visual rules with filterJson & filterInput
  useEffect(() => {
    if (activeTab === 'visual') {
      const compiledFilter: Record<string, any> = {};
      let hasValidRule = false;

      rules.forEach(rule => {
        if (!rule.field.trim()) return;
        hasValidRule = true;

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
        } else if (rule.operator === '$regex') {
          compiledFilter[rule.field] = { $regex: val, $options: 'i' };
        } else {
          compiledFilter[rule.field] = { [rule.operator]: val };
        }
      });

      if (hasValidRule) {
        const jsonStr = JSON.stringify(compiledFilter, null, 2);
        setFilterJson(jsonStr);
      }
    }
  }, [rules, activeTab]);

  const handleAddRule = () => {
    setRules(prev => [...prev, { id: Date.now().toString(), field: '', operator: '$regex', value: '' }]);
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
      let filterObj: any = {};
      const rawText = filterInput.trim();

      if (rawText) {
        if (rawText.startsWith('{') && rawText.endsWith('}')) {
          // Direct JSON query
          filterObj = JSON.parse(rawText);
        } else {
          // Plain keyword search across schema fields
          if (schemaFields.length > 0) {
            filterObj = {
              $or: schemaFields.slice(0, 5).map(field => ({
                [field]: { $regex: rawText, $options: 'i' }
              }))
            };
          } else {
            filterObj = { title: { $regex: rawText, $options: 'i' } };
          }
        }
      }

      const projection = projectionJson.trim() && projectionJson !== '{}' ? JSON.parse(projectionJson) : {};
      const sort = sortJson.trim() && sortJson !== '{}' ? JSON.parse(sortJson) : {};

      onExecuteQuery({ filter: filterObj, projection, sort });
    } catch (err: any) {
      setJsonError(`Query Syntax Error: ${err.message}`);
    }
  };

  const handleReset = () => {
    setFilterInput('');
    setFilterJson('{}');
    setProjectionJson('{}');
    setSortJson('{}');
    setRules([{ id: '1', field: '', operator: '$regex', value: '' }]);
    setJsonError(null);
    onExecuteQuery({ filter: {}, projection: {}, sort: {} });
  };

  const handleApplyFromVisual = () => {
    if (filterJson && filterJson !== '{}') {
      setFilterInput(filterJson.replace(/\n\s*/g, ' '));
    }
    handleRun();
    setDrawerOpen(false);
  };

  return (
    <div className="flex flex-col flex-shrink-0 relative z-10">
      {/* 1. Unified Slim Pro Bar (Suggestion 1 - TablePlus/Compass Style) */}
      <div className="db-query-pro-bar">
        {/* Left: Active collection title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
            <TableIcon className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
            <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-[200px]">
              {selectedCollection || 'No Collection'}
            </span>
          </div>
        </div>

        {/* Center: Inline Fast Filter Box */}
        <div className="db-filter-box">
          <span className="text-[10px] font-mono font-bold text-[var(--accent-emerald)] select-none">
            Filter:
          </span>
          <input
            type="text"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRun();
              if (e.key === 'Escape') setDrawerOpen(false);
            }}
            placeholder='{ "title": "..." } or search keyword...'
            className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-[120px]"
          />

          {filterInput && (
            <button
              onClick={() => { setFilterInput(''); onExecuteQuery({ filter: {} }); }}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Clear filter"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Find Button */}
          <button
            onClick={handleRun}
            disabled={loading}
            className="db-btn db-btn-primary db-text-xs py-1 px-2.5"
            title="Execute query (Enter)"
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span className="hidden sm:inline">{loading ? 'Running...' : 'Find'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="db-btn db-btn-secondary db-text-xs py-1 px-2"
            title="Clear and reset filter"
          >
            Reset
          </button>

          {/* Options ▾ Dropdown Toggle Button */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`db-btn db-text-xs py-1 px-2 ${drawerOpen ? 'db-btn-primary' : 'db-btn-secondary'}`}
            title="Advanced visual rules, sort, projection & code editor"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden md:inline">Options</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${drawerOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Right: Runtime latency indicator */}
        <div className="flex items-center gap-2">
          {executionTimeMs !== undefined && executionTimeMs !== null && (
            <div className="db-badge db-badge-green font-mono text-xs hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{executionTimeMs} ms</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Options / Advanced Filter Drawer (Slides open on demand without pushing table) */}
      {drawerOpen && (
        <div className="db-query-drawer">
          {/* Drawer Header Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('visual')}
                className={`db-pill-btn ${activeTab === 'visual' ? 'active' : ''}`}
              >
                <SlidersHorizontal className="w-3 h-3" /> Visual Rules
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`db-pill-btn ${activeTab === 'options' ? 'active' : ''}`}
              >
                <Filter className="w-3 h-3" /> Sort & Projection
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`db-pill-btn ${activeTab === 'code' ? 'active' : ''}`}
              >
                <Code2 className="w-3 h-3" /> Raw Mongo Query
              </button>
            </div>

            <button
              onClick={() => setDrawerOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
              title="Close options"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab 1: Visual Rule Builder */}
          {activeTab === 'visual' && (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="db-rule-row">
                  <input
                    type="text"
                    list={`fields-${rule.id}`}
                    placeholder="Field name (e.g. title)"
                    value={rule.field}
                    onChange={(e) => handleUpdateRule(rule.id, 'field', e.target.value)}
                    className="db-input db-input-mono db-text-xs flex-1 min-w-[120px]"
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
                    className="db-input db-text-xs db-font-mono text-[var(--accent-cyan)] w-48"
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Value (e.g. Sample)"
                    value={rule.value}
                    onChange={(e) => handleUpdateRule(rule.id, 'value', e.target.value)}
                    className="db-input db-input-mono db-text-xs flex-1 min-w-[120px]"
                  />

                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    disabled={rules.length === 1}
                    className="db-btn db-btn-danger db-p-1"
                    title="Remove rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleAddRule}
                  className="db-btn db-btn-secondary db-text-xs text-[var(--accent-emerald)]"
                >
                  <Plus className="w-3 h-3" /> Add Condition
                </button>

                {schemaFields.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] overflow-x-auto">
                    <span className="hidden sm:inline">Fields:</span>
                    {schemaFields.slice(0, 5).map(f => (
                      <button
                        key={f}
                        onClick={() => {
                          if (rules[0]) handleUpdateRule(rules[0].id, 'field', f);
                          else setRules([{ id: Date.now().toString(), field: f, operator: '$regex', value: '' }]);
                        }}
                        className="px-1.5 py-0.5 rounded bg-[var(--bg-panel)] border border-[var(--border-color)] text-[10px] font-mono hover:text-[var(--text-primary)]"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Sort & Projection */}
          {activeTab === 'options' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="db-card-box flex flex-col gap-1.5">
                <span className="text-xs font-mono font-bold text-[var(--accent-purple)]">
                  Sort Order JSON
                </span>
                <input
                  type="text"
                  placeholder='e.g. { "createdAt": -1 }'
                  value={sortJson}
                  onChange={(e) => setSortJson(e.target.value)}
                  className="db-input db-input-mono text-xs"
                />
                <span className="text-[10px] text-[var(--text-muted)]">1 for ascending, -1 for descending</span>
              </div>

              <div className="db-card-box flex flex-col gap-1.5">
                <span className="text-xs font-mono font-bold text-[var(--accent-cyan)]">
                  Projection (Field Mask)
                </span>
                <input
                  type="text"
                  placeholder='e.g. { "description": 0 }'
                  value={projectionJson}
                  onChange={(e) => setProjectionJson(e.target.value)}
                  className="db-input db-input-mono text-xs"
                />
                <span className="text-[10px] text-[var(--text-muted)]">Specify fields to include (1) or exclude (0)</span>
              </div>
            </div>
          )}

          {/* Tab 3: Raw Mongo JSON Editor */}
          {activeTab === 'code' && (
            <div className="h-56 border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-card)] shadow-inner">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === 'theme-light' ? 'light' : 'vs-dark'}
                value={filterJson}
                onChange={(v) => setFilterJson(v || '{}')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: 'Fira Code, monospace',
                  lineNumbers: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  padding: { top: 8, bottom: 8 }
                }}
              />
            </div>
          )}

          {/* Json Error Alert */}
          {jsonError && (
            <div className="db-alert-box">
              <AlertTriangle className="w-4 h-4" />
              <span>{jsonError}</span>
            </div>
          )}

          {/* Drawer Footer Actions */}
          <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-2 mt-1">
            <span className="text-[11px] text-[var(--text-muted)]">
              Applies to current collection query
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerOpen(false)}
                className="db-btn db-btn-secondary db-text-xs"
              >
                Close
              </button>
              <button
                onClick={handleApplyFromVisual}
                className="db-btn db-btn-primary db-text-xs"
              >
                <Check className="w-3 h-3" />
                <span>Apply Filter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
