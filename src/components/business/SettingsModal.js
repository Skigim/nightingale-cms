/**
 * SettingsModal.js - Settings and data management modal
 *
 * Business component for application settings, file system connection, and data management.
 * Migrated to ES module component registry.
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, getComponent } from '../../services/registry';

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

  // Get dependencies
  const Modal = getComponent('ui', 'Modal') || window.Modal;
  const showToast =
    window.showToast || window.NightingaleToast?.show || function () {};

  // Validate required props
  if (!Modal) {
    return null;
  }

  if (typeof onClose !== 'function') {
    return null;
  }

  const handleConnect = async () => {
    if (!fileService?.connect) {
      showToast('File service not available', 'error');
      return;
    }

    setIsConnecting(true);
    try {
      const connected = await fileService.connect();
      if (connected) {
        if (onFileStatusChange) onFileStatusChange('connected');
        showToast('Directory connected successfully!', 'success');
      } else {
        if (onFileStatusChange) onFileStatusChange('disconnected');
        showToast('Failed to connect to directory', 'error');
      }
    } catch (error) {
      const logger = window.NightingaleLogger?.get('settings:connect');
      logger?.error('Directory connection failed', { error: error.message });
      if (onFileStatusChange) onFileStatusChange('disconnected');
      showToast('Error connecting to directory', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLoadData = async () => {
    if (!fileService?.readFile) {
      showToast('File service not available', 'error');
      return;
    }

    setLoadingData(true);
    try {
      const data = await fileService.readFile();
      if (data) {
        const normalizedData = window.NightingaleDataManagement
          ?.normalizeDataMigrations
          ? await window.NightingaleDataManagement.normalizeDataMigrations(data)
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
      const logger = window.NightingaleLogger?.get('settings:loadData');
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

    try {
      const sampleData = {
        cases: [
          {
            id: 'case-001',
            mcn: 'MCN-2025-001',
            personId: 'person-001',
            status: 'Pending',
            applicationDate: '2025-08-01',
            description: 'Sample case for testing',
            caseType: 'VR',
            priority: 'Normal',
            address: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
            organizationId: 'org-001',
            authorizedReps: [],
          },
          {
            id: 'case-002',
            mcn: 'MCN-2025-002',
            personId: 'person-002',
            status: 'Approved',
            applicationDate: '2025-08-05',
            description: 'Another sample case',
            caseType: 'LTC',
            priority: 'High',
            address: '456 Oak Ave',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62702',
            organizationId: 'org-002',
            authorizedReps: [],
          },
        ],
        people: [
          {
            id: 'person-001',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '(555) 123-4567',
            address: '123 Main St, Springfield, IL 62701',
            status: 'active',
            dateAdded: new Date().toISOString(),
          },
          {
            id: 'person-002',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '(555) 234-5678',
            address: '789 Pine St, Springfield, IL 62703',
            status: 'active',
            dateAdded: new Date().toISOString(),
          },
        ],
        organizations: [
          {
            id: 'org-001',
            name: 'Springfield Community Services',
            type: 'Non-Profit',
            contactPerson: 'Mary Wilson',
            email: 'info@springfieldcs.org',
            phone: '(555) 987-6543',
            address: '100 Community Drive, Springfield, IL 62701',
            status: 'active',
            dateAdded: new Date().toISOString(),
          },
          {
            id: 'org-002',
            name: 'Regional Health Center',
            type: 'Healthcare',
            contactPerson: 'Dr. Sarah Davis',
            email: 'contact@regionalhc.org',
            phone: '(555) 876-5432',
            address: '200 Medical Plaza, Springfield, IL 62702',
            status: 'active',
            dateAdded: new Date().toISOString(),
          },
        ],
        financials: [
          {
            id: 'fin-001',
            caseId: 'case-001',
            amount: 1250.0,
            description: 'VR Services',
            category: 'Training',
          },
        ],
        notes: [
          {
            id: 'note-001',
            caseId: 'case-001',
            content: 'Initial assessment completed',
            date: '2025-08-02',
            type: 'Assessment',
          },
        ],
        vrRequests: [
          {
            id: 'vr-001',
            caseId: 'case-001',
            status: 'Pending',
            requestDate: '2025-08-01',
          },
        ],
      };

      await fileService.writeFile(sampleData);
      if (onDataLoaded) onDataLoaded(sampleData);
      showToast('Sample data created and loaded!', 'success');
      onClose();
    } catch (error) {
      const logger = window.NightingaleLogger?.get('settings:createSample');
      logger?.error('Sample data creation failed', { error: error.message });
      showToast('Error creating sample data', 'error');
    }
  };

  if (!isOpen) return null;

  return (
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
          <h3 className="text-lg font-semibold text-white">Data Management</h3>
          <p className="text-gray-400 text-sm">
            Load existing data or create sample data for testing.
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
          </div>
        </div>
        <div className="space-y-2 p-4 bg-gray-700 rounded-lg">
          <h4 className="font-medium text-white">Instructions:</h4>
          <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
            <li>
              Click &apos;Connect to Directory&apos; and select your Nightingale
              project folder
            </li>
            <li>
              Use &apos;Load Data File&apos; to load existing
              nightingale-data.json
            </li>
            <li>
              Or use &apos;Create Sample Data&apos; to generate test cases for
              development
            </li>
          </ol>
        </div>
      </div>
    </Modal>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fileService: PropTypes.object,
  onDataLoaded: PropTypes.func,
  fileStatus: PropTypes.oneOf(['connected', 'disconnected', 'connecting']),
  onFileStatusChange: PropTypes.func,
};

// Register with business registry (legacy global removed)
registerComponent('business', 'SettingsModal', SettingsModal);

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsModal;
}

// ES6 Module Export
export default SettingsModal;
