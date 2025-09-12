import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

function BugReportModal({
  isOpen,
  onClose,
  onSubmit,
  activeTab,
  includeDiagnostics = true,
  diagnostics: incomingDiagnostics,
}) {
  const [text, setText] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(!!includeDiagnostics);

  const handleSubmit = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    const payload = { content, activeTab, createdAt: new Date().toISOString() };
    if (showDiagnostics) {
      payload.diagnostics = incomingDiagnostics || {
        userAgent: globalThis?.navigator?.userAgent || 'unknown',
        platform: globalThis?.navigator?.platform || 'unknown',
        language: globalThis?.navigator?.language || 'unknown',
        viewport: {
          width: globalThis?.innerWidth || null,
          height: globalThis?.innerHeight || null,
        },
      };
    }
    onSubmit?.(payload);
    setText('');
  }, [text, onSubmit, activeTab, showDiagnostics, incomingDiagnostics]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative bg-gray-800 text-white rounded-md shadow-xl w-full max-w-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Report a Bug</h2>
        <p className="text-sm text-gray-300 mb-3">Active tab: {activeTab}</p>
        <textarea
          className="w-full h-40 p-2 rounded-md bg-gray-900 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the problem, steps to reproduce, and expected behavior..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {includeDiagnostics && (
          <div className="mt-3 text-sm text-gray-300">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={showDiagnostics}
                onChange={(e) => setShowDiagnostics(e.target.checked)}
              />
              Include diagnostics (browser, platform, viewport)
            </label>
          </div>
        )}
        <div className="mt-3 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

BugReportModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  activeTab: PropTypes.string,
  includeDiagnostics: PropTypes.bool,
  diagnostics: PropTypes.object,
};

registerComponent('business', 'BugReportModal', BugReportModal);

export default BugReportModal;
