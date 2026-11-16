import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { useConnection } from '../../context/ConnectionContext';

interface ConfirmDestructionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmTargetName: string;
  confirmButtonText?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const ConfirmDestructionModal: React.FC<ConfirmDestructionModalProps> = ({
  isOpen,
  title,
  message,
  confirmTargetName,
  confirmButtonText = 'Confirm & Permanently Delete',
  onConfirm,
  onClose
}) => {
  const { readOnlyMode } = useConnection();
  const [typedValue, setTypedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTypedValue('');
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isMatched = typedValue.trim().toLowerCase() === confirmTargetName.trim().toLowerCase();

  const handleExecute = async () => {
    if (readOnlyMode || !isMatched || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (err: any) {
      alert(`Action failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="db-modal-overlay" onClick={!isSubmitting ? onClose : undefined}>
      <div
        className="db-modal-box max-w-md p-0 overflow-hidden bg-[var(--bg-panel)] border border-rose-500/40 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-rose-500/20 bg-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-400">{title}</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Irreversible Destructive Action</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {readOnlyMode && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Read-Only Safety Guard is active. Destructive mutations are locked.</span>
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>

          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
            <label className="text-[11px] text-[var(--text-muted)] block">
              To proceed, please type <strong className="text-rose-400 font-mono select-all px-1 py-0.5 rounded bg-rose-500/15 border border-rose-500/30">{confirmTargetName}</strong> below:
            </label>
            <input
              ref={inputRef}
              type="text"
              disabled={readOnlyMode || isSubmitting}
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isMatched) {
                  handleExecute();
                }
              }}
              placeholder={`Type "${confirmTargetName}" to confirm`}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={readOnlyMode || !isMatched || isSubmitting}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-950"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
