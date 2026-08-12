import React, { useState } from 'react';
import { Database, Shield, ShieldAlert, Sparkles, Key, Wifi, RefreshCw, Menu, Layers, Palette, Check } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';

interface HeaderProps {
  onOpenConnectionModal: () => void;
  onOpenAiDrawer: () => void;
  onOpenSchemaModal: () => void;
  onToggleSidebar?: () => void;
}

const THEME_OPTIONS = [
  { id: 'theme-mongo', name: 'MongoDB Compass', tag: 'Dark Emerald', color: '#10b981' },
  { id: 'theme-postman', name: 'Postman Sunset', tag: 'Dark Orange', color: '#ff6c37' },
  { id: 'theme-vscode', name: 'VS Code Midnight', tag: 'Dark Blue', color: '#007acc' },
  { id: 'theme-cyberpunk', name: 'Cyberpunk Neon', tag: 'Dark Pink', color: '#ec4899' },
  { id: 'theme-light', name: 'Studio Clean', tag: 'Light Mode', color: '#059669' }
];

export const Header: React.FC<HeaderProps> = ({
  onOpenConnectionModal,
  onOpenAiDrawer,
  onOpenSchemaModal,
  onToggleSidebar
}) => {
  const {
    activeProfile,
    isConnected,
    readOnlyMode,
    toggleReadOnly,
    connectionLatency,
    selectedDb,
    selectedCollection,
    refreshCollections,
    geminiApiKey,
    setGeminiApiKey,
    theme,
    setTheme
  } = useConnection();

  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiApiKey);

  const handleSaveKey = () => {
    setGeminiApiKey(keyInput);
    setShowKeyInput(false);
  };

  return (
    <header className="db-header">
      {/* Left: Branding & Connection Status */}
      <div className="db-flex db-items-center db-gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="db-p-1-5 db-rounded-lg db-bg-slate-900 db-border db-border-slate-800 db-text-slate-400 hover:text-slate-100 db-transition db-hidden-md"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="db-flex db-items-center db-gap-2-5">
          <div className="db-header-logo">
            <Database className="w-4.5 h-4.5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="db-header-title db-flex db-items-center db-gap-1-5">
              DB Explorer 
              <span className="db-header-badge">v1.0 Pro</span>
            </h1>
          </div>
        </div>

        <div className="db-hidden-sm w-1 h-4 db-bg-slate-800 mx-1" />

        {/* Profile / Connection Button */}
        <button
          onClick={onOpenConnectionModal}
          className="db-flex db-items-center db-gap-2 db-px-2-5 db-py-1-5 db-rounded-lg db-bg-slate-900-90 hover:db-bg-slate-900 db-border db-border-slate-800 db-text-xs db-text-secondary db-transition"
        >
          <span
            className="w-2 h-2 db-rounded-full db-flex-shrink-0"
            style={{ backgroundColor: isConnected ? '#10b981' : '#ef4444' }}
          />
          <span className="db-font-semibold db-truncate max-w-[120px] sm:max-w-[160px]">
            {activeProfile ? activeProfile.name : 'Disconnected'}
          </span>
          {isConnected && connectionLatency !== null && (
            <span className="db-hidden-sm db-flex db-text-xs font-mono db-text-muted db-items-center db-gap-0-5 ml-1">
              <Wifi className="w-3 h-3 db-icon-emerald" /> {connectionLatency}ms
            </span>
          )}
        </button>
      </div>

      {/* Middle: Active DB & Collection breadcrumb */}
      <div className="db-hidden-md db-flex db-items-center db-gap-2 db-text-xs font-mono db-bg-slate-900-80 db-px-3 db-py-1 db-rounded-lg db-border db-border-slate-800-80">
        <span className="db-text-muted">Database:</span>
        <span className="db-text-emerald db-font-bold">{selectedDb || 'None'}</span>
        <span className="db-text-muted">/</span>
        <span className="db-text-muted">Collection:</span>
        <span className="db-text-cyan db-font-bold">{selectedCollection || 'None'}</span>
        {selectedCollection && (
          <button
            onClick={refreshCollections}
            className="ml-1 db-text-muted hover:db-text-primary db-transition"
            title="Refresh metadata"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Right Actions: Read Only Safety Guard & AI Assistant & API Key */}
      <div className="db-flex db-items-center db-gap-2 sm:db-gap-3">
        {/* Read Only Toggle */}
        <button
          onClick={toggleReadOnly}
          className={`db-flex db-items-center db-gap-1-5 db-px-2-5 db-py-1 db-rounded-lg db-text-xs db-font-semibold db-border db-transition ${
            readOnlyMode
              ? 'db-bg-amber-15 db-text-amber db-border-amber-30'
              : 'db-bg-emerald-15 db-text-emerald db-border-emerald-30'
          }`}
          title={readOnlyMode ? 'Read-Only Safety Guard ACTIVE (Writes Blocked)' : 'Read-Write Mode Active'}
        >
          {readOnlyMode ? <ShieldAlert className="w-3.5 h-3.5 db-text-amber" /> : <Shield className="w-3.5 h-3.5 db-text-emerald" />}
          <span className="db-hidden-sm">{readOnlyMode ? 'Read-Only Mode' : 'Read/Write Mode'}</span>
        </button>

        {/* Schema Inspector Button */}
        {selectedCollection && (
          <button
            onClick={onOpenSchemaModal}
            className="db-hidden-sm db-flex db-items-center db-gap-1-5 db-px-2-5 db-py-1 db-rounded-lg db-text-xs db-font-semibold db-bg-slate-900 hover:db-bg-slate-900-80 db-text-secondary db-border db-border-slate-800 db-transition"
          >
            <Layers className="w-3.5 h-3.5 db-icon-cyan" />
            <span>Schema & Indexes</span>
          </button>
        )}

        {/* Theme Switcher Button & Dropdown */}
        <div className="db-relative">
          <button
            onClick={() => { setShowThemePicker(!showThemePicker); setShowKeyInput(false); }}
            className="db-flex db-items-center db-gap-1-5 db-px-2-5 db-py-1-5 db-rounded-lg db-bg-slate-900 hover:db-bg-slate-900-80 db-border db-border-slate-800 db-text-xs db-text-secondary db-transition"
            title="Switch Workspace Theme"
          >
            <Palette className="w-4 h-4 db-icon-emerald" />
            <span className="db-hidden-sm font-semibold">Theme</span>
          </button>

          {showThemePicker && (
            <div className="absolute right-0 top-11 w-64 db-p-3 db-bg-slate-900 db-border db-border-slate-800 db-rounded-xl db-shadow-2xl db-z-50 animate-slide-down">
              <div className="db-flex db-items-center db-justify-between mb-2 border-b db-border-slate-800 pb-2">
                <h4 className="db-text-xs db-font-semibold db-text-primary db-flex db-items-center db-gap-1-5">
                  <Palette className="w-4 h-4 db-icon-emerald" /> Select Theme
                </h4>
                <span className="db-text-xs db-text-muted">5 Themes</span>
              </div>
              <div className="db-space-y-1">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id);
                      setShowThemePicker(false);
                    }}
                    className={`w-full db-flex db-items-center db-justify-between db-p-2 db-rounded-lg db-text-xs db-transition ${
                      theme === opt.id
                        ? 'db-bg-emerald-15 db-text-emerald db-font-bold db-border db-border-emerald-30'
                        : 'hover:db-bg-slate-800 db-text-secondary'
                    }`}
                  >
                    <div className="db-flex db-items-center db-gap-2">
                      <span className="w-2.5 h-2.5 db-rounded-full" style={{ backgroundColor: opt.color }} />
                      <span className="db-text-left">{opt.name}</span>
                    </div>
                    {theme === opt.id && <Check className="w-3.5 h-3.5 db-text-emerald" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gemini API Key indicator / input */}
        <div className="db-relative">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`db-p-1-5 db-rounded-lg db-border db-text-xs db-transition ${
              geminiApiKey
                ? 'db-bg-purple-15 db-border-purple-30 db-text-purple'
                : 'db-bg-slate-900 db-border-slate-800 db-text-slate-400 hover:db-text-slate-200'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-4 h-4" />
          </button>

          {showKeyInput && (
            <div className="absolute right-0 top-11 w-72 db-p-3-5 db-bg-slate-900 db-border db-border-slate-800 db-rounded-xl db-shadow-2xl db-z-50 animate-slide-down">
              <h4 className="db-text-xs db-font-semibold db-text-primary mb-1 db-flex db-items-center db-gap-1-5">
                <Key className="w-4 h-4 db-icon-purple" /> Gemini API Key
              </h4>
              <p className="db-text-xs db-text-muted mb-2-5">
                Enter custom Google Gemini API Key or leave empty to use server default.
              </p>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field mb-3 db-text-xs"
              />
              <div className="db-flex db-justify-end db-gap-2">
                <button
                  onClick={() => setShowKeyInput(false)}
                  className="db-px-2-5 db-py-1 db-text-xs db-text-muted hover:db-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKey}
                  className="btn btn-primary db-text-xs db-py-1 db-px-3"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Query Assistant Button */}
        <button
          onClick={onOpenAiDrawer}
          className="btn btn-ai db-text-xs db-py-1 db-px-3 db-shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-200" />
          <span className="db-hidden-sm">AI Assistant</span>
        </button>
      </div>
    </header>
  );
};
