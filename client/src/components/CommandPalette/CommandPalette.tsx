import React, { useState, useEffect } from 'react';
import { Search, Database, Table, Sparkles, Command, ArrowRight, Shield, Layers } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: { type: string; payload?: any }) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const { databases, collections, selectedDb, openTab, toggleReadOnly } = useConnection();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    ...collections.map(c => ({
      id: `coll-${c.name}`,
      category: 'Collection',
      label: `Open Collection: ${c.name}`,
      icon: <Table className="w-4 h-4 text-cyan-400" />,
      handler: () => {
        if (selectedDb) openTab(selectedDb, c.name);
        onClose();
      }
    })),
    ...databases.map(db => ({
      id: `db-${db.name}`,
      category: 'Database',
      label: `Switch Database: ${db.name}`,
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      handler: () => {
        onSelectAction({ type: 'switch-db', payload: db.name });
        onClose();
      }
    })),
    {
      id: 'ai-prompt',
      category: 'AI Assistant',
      label: 'Open Natural Language AI Query Assistant',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      handler: () => {
        onSelectAction({ type: 'open-ai' });
        onClose();
      }
    },
    {
      id: 'toggle-readonly',
      category: 'Security',
      label: 'Toggle Read-Only Safety Guard',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      handler: () => {
        toggleReadOnly();
        onClose();
      }
    },
    {
      id: 'aggregation-mode',
      category: 'View',
      label: 'Switch to Aggregation Pipeline Visualizer',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      handler: () => {
        onSelectAction({ type: 'mode-aggregation' });
        onClose();
      }
    }
  ];

  const filteredActions = actions.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-box animate-fade-in db-flex db-flex-col">
        {/* Input header */}
        <div className="db-modal-header">
          <Search className="db-icon-sm db-icon-emerald" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, collection, database name... (Ctrl + K)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
            className="db-input db-full-w db-text-xs"
          />
          <span className="db-badge db-badge-cyan">ESC to close</span>
        </div>

        {/* Results */}
        <div className="db-modal-body db-space-y-1">
          {filteredActions.length === 0 ? (
            <div className="db-p-6 db-text-center db-text-xs db-text-muted">
              No matching commands or collections found.
            </div>
          ) : (
            filteredActions.map((action, idx) => (
              <button
                key={action.id}
                onClick={action.handler}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`db-command-item ${
                  selectedIndex === idx ? 'active' : ''
                }`}
              >
                <div className="db-row-start">
                  {action.icon}
                  <span className="db-font-semibold">{action.label}</span>
                </div>
                <div className="db-row-end">
                  <span className="db-badge db-badge-purple">
                    {action.category}
                  </span>
                  <ArrowRight className="db-icon-xs db-icon-emerald" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
