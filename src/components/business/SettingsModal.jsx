/* global __DEV__ */
/**
 * SettingsModal.js - Settings and data management modal
 *
 * Business component for application settings, file system connection, and data management.
 * Migrated to ES module component registry.
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, getComponent } from '../../services/registry';
import Toast from '../../services/nightingale.toast.js';
import {
  getStrictValidationEnabled,
  toggleStrictValidation,
  subscribeSettings,
} from '../../services/settings.js';
import { normalizeDataset } from '../../services/dataFixes.js';
import {
  detectLegacyProfile,
  runFullMigration,
} from '../../services/migration.js';

/**
 * SettingsModal Component
 * Modal for managing application settings and data operations
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Object} props.fileService - File service for data operations
 * @param {Function} props.onDataLoaded - Callback when data is loaded
 * @param {string} props.fileStatus - Current file connection status
 * @param {Function} props.onFileStatusChange - Callback when file status changes
 * @returns {React.Element} SettingsModal component
 */
function SettingsModal({
  isOpen,
  onClose,
  fileService,
  onDataLoaded,
  fileStatus,
  onFileStatusChange,
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false); // legacy naming retained for minimal ripple
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [detection, setDetection] = useState(null);
  const [migrationReport, setMigrationReport] = useState(null);
  const [migrationError, setMigrationError] = useState(null);
  const [migratedData, setMigratedData] = useState(null);
  // Diagnostics state
  const initialNavLogs = (() => {
    try {
      const v = localStorage.getItem('nightingale:navLogs');
      return v === '1' || v === 'true' || v === 'on';
    } catch (_) {
      return false;
    }
  })();
  const initialLevel = (() => {
    try {
      return globalThis.NightingaleLogger?.getConfig?.().level || 'info';
    } catch (_) {
      return 'info';
    }
  })();
  const [navLogsEnabled, setNavLogsEnabled] = useState(initialNavLogs);
  const [logLevel, setLogLevel] = useState(initialLevel);
  const [strictValidation, setStrictValidation] = useState(
    getStrictValidationEnabled(),
  );
  useEffect(() => {
    const unsub = subscribeSettings((s) => {
      setStrictValidation(!!s.strictValidation);
    });
    return () => unsub();
  }, []);

  // Get dependencies (resolved after state/effect declarations to avoid conditional hook ordering issues)
  const Modal = getComponent('ui', 'Modal');
  const showToast = (msg, type) => {
    // Call module toast
    Toast.showToast?.(msg, type);
    // Also call global for test/back-compat
    if (typeof globalThis !== 'undefined') {
      const g = globalThis;
      if (typeof g.showToast === 'function') g.showToast(msg, type);
      else if (g.window && typeof g.window.showToast === 'function')
        g.window.showToast(msg, type);
    }
  };

  // Demo Mode (embedded sample dataset) -------------------------------------
  // NOTE: This block must remain above any early returns to preserve hook ordering.
  const [demoMode, setDemoMode] = useState(false);
  useEffect(() => {
    // Detect existing demo mode (presence of meta.source === embedded-sample)
    try {
      const raw = localStorage.getItem('nightingale_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.meta?.source === 'embedded-sample') setDemoMode(true);
      }
    } catch (_) {
      /* ignore */
    }
  }, []);

  const enableDemoMode = async () => {
    try {
      const { loadEmbeddedSampleData } = await import(
        '../../services/staticSampleLoader.js'
      );
      const dataset = await loadEmbeddedSampleData('/sample-data.json');
      try {
        localStorage.setItem('nightingale_data', JSON.stringify(dataset));
      } catch (_) {
        /* ignore */
      }
      onDataLoaded?.(dataset);
      setDemoMode(true);
      showToast('Demo mode enabled (embedded sample)', 'success');
    } catch (_) {
      showToast('Failed to enable demo mode', 'error');
    }
  };
  const disableDemoMode = async () => {
    try {
      try {
        localStorage.removeItem('nightingale_data');
      } catch (_) {
        /* ignore */
      }
      setDemoMode(false);
      // Option A chosen: clear in-memory data unless file is connected (then reload file)
      if (fileStatus === 'connected' && fileService?.readFile) {
        try {
          const data = await fileService.readFile();
          if (data && Object.keys(data).length > 0) {
            onDataLoaded?.(data);
          } else {
            onDataLoaded?.(null);
          }
        } catch (_) {
          onDataLoaded?.(null);
        }
      } else {
        onDataLoaded?.(null);
      }
      showToast('Demo mode disabled', 'info');
    } catch (_) {
      showToast('Failed to disable demo mode', 'error');
    }
  };
  const toggleDemoMode = async () => {
    if (demoMode) await disableDemoMode();
    else await enableDemoMode();
  };

  // Validate required props AFTER declaring hooks to avoid conditional hook execution
  if (!Modal) return null;
  if (typeof onClose !== 'function') return null;
  const handleConnect = async () => {
    const logger = globalThis.NightingaleLogger?.get('settings:connect');
    if (!fileService?.connect) {
      showToast('File service not available', 'error');
      return;
    }

    setIsConnecting(true);
    try {
      // Clear any embedded/local-only dataset to avoid confusion when switching to live directory
      try {
        localStorage.removeItem('nightingale_data');
      } catch (_) {
        /* ignore */
      }
      const connected = await fileService.connect();
      if (connected) {
        if (onFileStatusChange) onFileStatusChange('connected');
        showToast('Directory connected successfully!', 'success');
      } else {
        if (onFileStatusChange) onFileStatusChange('disconnected');
        showToast('Failed to connect to directory', 'error');
      }
    } catch (error) {
      logger?.error('Directory connection failed', { error: error.message });
      if (onFileStatusChange) onFileStatusChange('disconnected');
      showToast('Error connecting to directory', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fileService?.disconnect?.();
      onFileStatusChange?.('disconnected');
      showToast('Disconnected from directory', 'info');
    } catch (_) {
      showToast('Failed to disconnect', 'error');
    }
  };

  const handleLoadData = async () => {
    if (!fileService?.readFile) {
      showToast('File service not available', 'error');
      return;
    }

    setLoadingData(true);
    try {
      // Ensure local embedded sample cache cleared before loading canonical file-based data
      try {
        localStorage.removeItem('nightingale_data');
      } catch (_) {
        /* ignore */
      }
      const data = await fileService.readFile();
      if (data) {
        const normalizedData = globalThis.NightingaleDataManagement
          ?.normalizeDataMigrations
          ? await globalThis.NightingaleDataManagement.normalizeDataMigrations(
              data,
            )
          : data;

        if (onDataLoaded) onDataLoaded(normalizedData);
        showToast(
          `Data loaded successfully! Found ${normalizedData.cases?.length || 0} cases`,
          'success',
        );
        onClose();
      } else {
        showToast('No data file found', 'warning');
      }
    } catch (error) {
      const logger = globalThis.NightingaleLogger?.get('settings:loadData');
      logger?.error('Data loading failed', { error: error.message });
      showToast('Error loading data file', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateSample = async () => {
    if (!fileService?.writeFile) {
      showToast('File service not available', 'error');
      return;
    }
    // Provide functionality only in development builds to exclude heavy faker dependency from production bundle.
    // We use a global __DEV__ constant (defined by Vite and in test setup) instead of import.meta to keep Jest transformation simple.
    const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || false;
    const createSampleData = isDev
      ? async (opts) => {
          const mod = await import('../../services/sampleData.js');
          return mod.generateSampleData?.(opts) || {};
        }
      : null;

    if (!createSampleData) {
      showToast(
        'Sample data generation disabled in production build',
        'warning',
      );
      return;
    }

    try {
      const sampleData = await createSampleData({
        organizations: 20,
        people: 100,
        cases: 50,
      });
      await fileService.writeFile(sampleData);
      onDataLoaded?.(sampleData);
      showToast('Sample data created and loaded!', 'success');
      onClose();
    } catch (error) {
      const logger = globalThis.NightingaleLogger?.get('settings:createSample');
      logger?.error('Sample data creation failed', { error: error.message });
      showToast('Error creating sample data', 'error');
    }
  };

  // (Demo mode logic moved above early returns)

  const handleNormalizeDataset = async () => {
    if (!fileService?.writeFile) {
      showToast('File service not available', 'error');
      return;
    }
    if (!fileStatus || fileStatus !== 'connected') {
      showToast('Connect to directory first', 'warning');
      return;
    }
    setIsBackfilling(true);
    try {
      const currentData = await fileService.readFile();
      const { changed, updatedData, persisted, summary } =
        await normalizeDataset(currentData, fileService, true);
      if (changed > 0) {
        onDataLoaded?.(updatedData);
        const removed = summary?.caseClientNameRemoved || 0;
        const fixed = summary?.peopleNameFixed || 0;
        showToast(
          `Normalized dataset: ${fixed} person name fix${
            fixed === 1 ? '' : 'es'
          }, ${removed} case snapshot removal${removed === 1 ? '' : 's'}$${
            persisted ? ' (saved)' : ''
          }`,
          'success',
        );
      } else {
        showToast('No normalization changes required', 'info');
      }
    } catch (e) {
      showToast('Normalization failed', 'error');
    } finally {
      setIsBackfilling(false);
    }
  };

  const openMigrationModal = async () => {
    if (!fileService?.readFile) {
      showToast('File service not available', 'error');
      return;
    }
    if (fileStatus !== 'connected') {
      showToast('Connect to directory first', 'warning');
      return;
    }

    setIsMigrationOpen(true);
    setIsDetecting(true);
    setDetection(null);
    setMigrationReport(null);
    setMigrationError(null);
    setMigratedData(null);
    try {
      const rawData = await fileService.readFile();
      if (!rawData || Object.keys(rawData).length === 0) {
        setDetection({ isLegacy: false, indicators: {}, summary: [] });
        return;
      }
      const det = detectLegacyProfile(rawData);
      setDetection(det);
    } catch (err) {
      setMigrationError('Failed to analyze data');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRunMigration = async () => {
    if (!fileService?.writeFile) {
      showToast('File service not available', 'error');
      return;
    }
    setIsMigrating(true);
    setMigrationError(null);
    try {
      const rawData = await fileService.readFile();
      const { migratedData, report } = await runFullMigration(rawData, {
        applyFixes: true,
      });
      // Do not write immediately; store results and let user choose action
      setMigratedData(migratedData);
      setMigrationReport(report);
      showToast('Migration analysis complete. Choose how to proceed.', 'info');
    } catch (err) {
      setMigrationError('Migration failed');
      showToast('Migration failed', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDownloadMigrated = () => {
    try {
      if (!migratedData) return;
      const blob = new Blob([JSON.stringify(migratedData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nightingale-data.migrated.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Downloaded migrated JSON', 'success');
    } catch (_) {
      showToast('Failed to download JSON', 'error');
    }
  };

  const handleWriteAndBackup = async () => {
    if (!migratedData) return;
    if (!fileService) {
      showToast('File service not available', 'error');
      return;
    }
    setIsMigrating(true);
    try {
      let backupCreated = false;
      let written = false;
      let backupName = '';

      if (typeof fileService.backupAndWrite === 'function') {
        const res = await fileService.backupAndWrite(migratedData);
        backupCreated = !!res?.backupCreated;
        written = !!res?.written;
        backupName = res?.backupName || '';
      } else if (typeof fileService.writeNamedFile === 'function') {
        const ts = new Date().toISOString().replace(/[:]/g, '-');
        const name = `nightingale-data.backup-${ts}.json`;
        backupCreated = await fileService.writeNamedFile(name, migratedData);
        written = await fileService.writeFile(migratedData);
        backupName = name;
      } else if (typeof fileService.writeFile === 'function') {
        // Fallback: write without backup, and notify user
        written = await fileService.writeFile(migratedData);
      }

      if (written) {
        onDataLoaded?.(migratedData);
        const msg = backupCreated
          ? `Migration written with backup (${backupName})`
          : 'Migration written (no backup support)';
        showToast(msg, 'success');
      } else {
        // If we couldn't write, offer download fallback
        showToast(
          'Write failed or unsupported. Downloading JSON instead.',
          'warning',
        );
        handleDownloadMigrated();
      }
    } catch (_) {
      showToast('Write & backup failed', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings & Data Management"
        footerContent={
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <section className="p-4 border border-gray-700 rounded">
            <h3 className="text-lg font-semibold text-white mb-2">
              Validation Mode
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              Toggle strict required-field validation for creation/edit modals.
              When off, steps and submissions do not require mandatory fields.
            </p>
            <label className="flex items-center space-x-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={strictValidation}
                onChange={() => {
                  const next = toggleStrictValidation();
                  setStrictValidation(next);
                  Toast.showToast?.(
                    `Strict validation ${next ? 'enabled' : 'disabled'}`,
                    next ? 'info' : 'warning',
                  );
                }}
              />
              <span>Strict validation {strictValidation ? 'ON' : 'OFF'}</span>
            </label>
          </section>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              File System Connection
            </h3>
            <p className="text-gray-400 text-sm">
              Connect to your project directory to load and save case data.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isConnecting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isConnecting ? 'Connecting...' : 'Connect to Directory'}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white"
              >
                Disconnect
              </button>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  fileStatus === 'connected'
                    ? 'bg-green-600 text-green-100'
                    : 'bg-red-600 text-red-100'
                }`}
              >
                {fileStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Data Management
            </h3>
            <p className="text-gray-400 text-sm">
              Load existing data, create sample data, or run one-time data
              fixes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleLoadData}
                disabled={loadingData || fileStatus !== 'connected'}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  loadingData || fileStatus !== 'connected'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loadingData ? 'Loading...' : 'Load Data File'}
              </button>
              {/* Demo Mode handled by switch below; removed embedded sample button */}
              <button
                onClick={handleCreateSample}
                disabled={fileStatus !== 'connected'}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  fileStatus !== 'connected'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                Create Sample Data
              </button>
              <button
                onClick={handleNormalizeDataset}
                disabled={fileStatus !== 'connected' || isBackfilling}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  fileStatus !== 'connected' || isBackfilling
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isBackfilling ? 'Normalizing...' : 'Normalize Dataset'}
              </button>
              <button
                onClick={openMigrationModal}
                disabled={fileStatus !== 'connected'}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  fileStatus !== 'connected'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                Data Migration
              </button>
            </div>
          </div>
          {/* Diagnostics & Logging */}
          <div className="space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Diagnostics & Logging
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={navLogsEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setNavLogsEnabled(enabled);
                    try {
                      if (enabled)
                        localStorage.setItem('nightingale:navLogs', '1');
                      else localStorage.removeItem('nightingale:navLogs');
                      const logger = globalThis.NightingaleLogger?.get(
                        'settings:diagnostics',
                      );
                      logger?.info('Navigation logging toggled', { enabled });
                      showToast(
                        `Navigation logging ${enabled ? 'enabled' : 'disabled'}`,
                        'info',
                      );
                    } catch (_) {
                      showToast('Failed to update setting', 'error');
                    }
                  }}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-200">Enable navigation logs</span>
              </label>
              <div className="p-3 bg-gray-700 rounded-lg flex items-center justify-between">
                <div className="text-gray-200">Log level</div>
                <select
                  value={logLevel}
                  onChange={(e) => {
                    const lvl = e.target.value;
                    setLogLevel(lvl);
                    try {
                      globalThis.NightingaleLogger?.configure?.({ level: lvl });
                      const logger = globalThis.NightingaleLogger?.get(
                        'settings:diagnostics',
                      );
                      logger?.info('Log level changed', { level: lvl });
                      showToast(`Log level set to ${lvl}`, 'info');
                    } catch (_) {
                      showToast('Failed to set log level', 'error');
                    }
                  }}
                  className="bg-gray-600 text-white rounded px-2 py-1"
                >
                  <option value="trace">trace</option>
                  <option value="debug">debug</option>
                  <option value="info">info</option>
                  <option value="warn">warn</option>
                  <option value="error">error</option>
                  <option value="silent">silent</option>
                </select>
              </div>
              <button
                onClick={() => {
                  try {
                    const json =
                      globalThis.NightingaleLogger?.exportLogs?.('json');
                    const content =
                      typeof json === 'string'
                        ? json
                        : JSON.stringify(json, null, 2);
                    const blob = new Blob([content], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const ts = new Date().toISOString().replace(/[:.]/g, '-');
                    a.href = url;
                    a.download = `nightingale-logs-${ts}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    showToast('Logs exported', 'success');
                  } catch (_) {
                    showToast('Failed to export logs', 'error');
                  }
                }}
                className="px-4 py-3 rounded-lg font-medium transition-colors bg-gray-700 hover:bg-gray-600 text-white"
              >
                Export Recent Logs (JSON)
              </button>
              <div className="p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
                <div className="font-medium mb-1">Current logger status</div>
                <div>
                  {(() => {
                    try {
                      const cfg = globalThis.NightingaleLogger?.getConfig?.();
                      if (!cfg) return 'Logger unavailable';
                      return `level: ${cfg.level}, transports: ${cfg.transports.length}, enrichers: ${cfg.enrichers.length}`;
                    } catch (_) {
                      return 'Logger unavailable';
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 p-4 bg-gray-700 rounded-lg">
            <h4 className="font-medium text-white">Instructions:</h4>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>
                Click &apos;Connect to Directory&apos; and select your
                Nightingale project folder
              </li>
              <li>
                Use &apos;Load Data File&apos; to load existing
                nightingale-data.json
              </li>
              <li>
                Or use &apos;Create Sample Data&apos; to generate test cases for
                development
              </li>
              <li>
                Toggle &apos;Demo Mode&apos; below to quickly load/remove an
                embedded sample dataset without using the file system
              </li>
            </ol>
          </div>
          {/* Demo Mode Switch */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-sm tracking-wide">
                  Demo Mode
                </h3>
                <p className="text-gray-400 text-xs max-w-md">
                  Loads a small embedded dataset into memory & local storage.
                  Disabling clears it (and reloads live file data if connected).
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={demoMode}
                  onChange={toggleDemoMode}
                  aria-label="Toggle demo mode"
                />
                <span
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                    demoMode ? 'bg-teal-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-200 ${
                      demoMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </label>
            </div>
            {demoMode && (
              <div className="text-xs text-teal-300">
                Active – embedded sample sourced from{' '}
                <code>sample-data.json</code>
              </div>
            )}
          </div>
        </div>
      </Modal>
      {Modal && (
        <Modal
          isOpen={isMigrationOpen}
          onClose={() => {
            setIsMigrationOpen(false);
            setDetection(null);
            setMigrationReport(null);
            setMigrationError(null);
          }}
          title="Data Migration"
          size="large"
          footerContent={
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadMigrated}
                disabled={!migratedData || isMigrating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !migratedData || isMigrating
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Download Migrated JSON
              </button>
              <button
                onClick={handleWriteAndBackup}
                disabled={!migratedData || isMigrating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !migratedData || isMigrating
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                Write & Backup
              </button>
              <button
                onClick={() => {
                  setIsMigrationOpen(false);
                  setDetection(null);
                  setMigrationReport(null);
                  setMigrationError(null);
                  setMigratedData(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleRunMigration}
                disabled={isDetecting || isMigrating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDetecting || isMigrating
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isMigrating ? 'Processing...' : 'Run Full Migration'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {isDetecting && (
              <p className="text-gray-300">
                Analyzing data for legacy patterns…
              </p>
            )}
            {migrationError && <p className="text-red-400">{migrationError}</p>}
            {detection && (
              <div className="space-y-2">
                <h4 className="text-white font-semibold">Detection Summary</h4>
                {detection.isLegacy ? (
                  <ul className="list-disc list-inside text-gray-300">
                    {(detection.summary || []).length > 0 ? (
                      detection.summary.map((s, i) => <li key={i}>{s}</li>)
                    ) : (
                      <li>No specific indicators listed</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-300">
                    No legacy indicators detected.
                  </p>
                )}
              </div>
            )}
            {migrationReport && (
              <div className="space-y-2">
                <h4 className="text-white font-semibold">Migration Report</h4>
                <div className="text-gray-300 text-sm space-y-1">
                  <p>
                    Cases: {migrationReport.counts?.before?.cases || 0} →{' '}
                    {migrationReport.counts?.after?.cases || 0}
                  </p>
                  <p>
                    People: {migrationReport.counts?.before?.people || 0} →{' '}
                    {migrationReport.counts?.after?.people || 0}
                  </p>
                  <p>
                    Organizations:{' '}
                    {migrationReport.counts?.before?.organizations || 0} →{' '}
                    {migrationReport.counts?.after?.organizations || 0}
                  </p>
                  <p>
                    Client names added:{' '}
                    {migrationReport.fixes?.clientNamesAdded || 0}
                  </p>
                  {Array.isArray(
                    migrationReport.warnings?.orphanCasePersonIds,
                  ) &&
                    migrationReport.warnings.orphanCasePersonIds.length > 0 && (
                      <div>
                        <p className="text-yellow-300">
                          Orphan case personIds detected (
                          {migrationReport.warnings.orphanCasePersonIds.length}
                          ):
                        </p>
                        <div className="text-yellow-200 break-words">
                          {migrationReport.warnings.orphanCasePersonIds.join(
                            ', ',
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fileService: PropTypes.object,
  onDataLoaded: PropTypes.func,
  fileStatus: PropTypes.oneOf([
    'connected',
    'disconnected',
    'connecting',
    // Extended to support reconnect interim state (permission re-grant required)
    'reconnect',
  ]),
  onFileStatusChange: PropTypes.func,
};

// Register with business registry (legacy global removed)
registerComponent('business', 'SettingsModal', SettingsModal);

export default SettingsModal;
