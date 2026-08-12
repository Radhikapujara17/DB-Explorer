import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface TreeNodeProps {
  label: string;
  value: any;
  path: string;
  isLast?: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ label, value, path, isLast }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const getType = (val: any): string => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return `Array(${val.length})`;
    if (val && typeof val === 'object') {
      if (val.$oid) return 'ObjectId';
      if (val.$date) return 'Date';
      return 'Object';
    }
    return typeof val;
  };

  const getTypeColor = (type: string): string => {
    if (type === 'ObjectId') return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    if (type === 'Date') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (type === 'string') return 'text-emerald-400';
    if (type === 'number') return 'text-cyan-400';
    if (type === 'boolean') return 'text-pink-400';
    if (type.startsWith('Array')) return 'text-blue-400';
    return 'text-slate-400';
  };

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderValue = (val: any) => {
    if (val === null) return <span className="text-slate-500 italic">null</span>;
    if (val && typeof val === 'object') {
      if (val.$oid) return <span className="text-purple-300 font-mono">ObjectId("{val.$oid}")</span>;
      if (val.$date) return <span className="text-amber-300 font-mono">ISODate("{val.$date}")</span>;
    }
    if (typeof val === 'string') return <span className="text-emerald-300">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-cyan-300 font-mono">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-pink-300 font-mono">{val ? 'true' : 'false'}</span>;
    return <span>{String(val)}</span>;
  };

  return (
    <div className="db-font-mono db-text-xs db-py-1">
      <div
        className="db-tree-row"
        onClick={() => isExpandable && setIsOpen(!isOpen)}
      >
        {isExpandable ? (
          <button className="db-btn db-btn-secondary db-p-1">
            {isOpen ? <ChevronDown className="db-icon-xs" /> : <ChevronRight className="db-icon-xs" />}
          </button>
        ) : (
          <span className="db-icon-xs" />
        )}

        <span className="db-font-semibold db-text-secondary">{label}:</span>

        <span className={`db-badge ${getTypeColor(getType(value))}`}>
          {getType(value)}
        </span>

        {!isExpandable && (
          <span className="db-px-2">{renderValue(value)}</span>
        )}

        <button
          onClick={handleCopyPath}
          className="db-btn db-btn-secondary db-p-1 db-row-end"
          title={`Copy key path: ${path}`}
        >
          {copied ? <Check className="db-icon-xs db-icon-emerald" /> : <Copy className="db-icon-xs" />}
        </button>
      </div>

      {isExpandable && isOpen && (
        <div className="db-tree-indent">
          {isArray ? (
            value.map((item: any, idx: number) => (
              <TreeNode
                key={idx}
                label={`[${idx}]`}
                value={item}
                path={`${path}[${idx}]`}
                isLast={idx === value.length - 1}
              />
            ))
          ) : (
            Object.keys(value).map((key, idx, arr) => (
              <TreeNode
                key={key}
                label={key}
                value={value[key]}
                path={`${path}.${key}`}
                isLast={idx === arr.length - 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
