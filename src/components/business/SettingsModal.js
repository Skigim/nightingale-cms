/**
 * SettingsModal.js - Settings and data management modal
 * 
 * Business component for application settings, file system connection, and data management.
 * Provides functionality to connect to directories, load/save data, and create sample datasets.
 * 
 * @namespace NightingaleBusiness
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

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
function SettingsModal({ isOpen, onClose, fileService, onDataLoaded, fileStatus, onFileStatusChange }) {
  // React safety check
  if (!window.React) {
    console.warn('React not available for SettingsModal component');
    return null;
  }

  const e = window.React.createElement;
  const { useState } = window.React;

  // Component state
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Get dependencies
  const Modal = window.Modal || window.NightingaleUI?.getComponent?.('Modal');
  const showToast = window.showToast || window.NightingaleToast?.show || function(message, type) {
    console.log(`Toast ${type}: ${message}`);
  };

  // Validate required props
  if (!Modal) {
    console.warn('SettingsModal: Modal component not available');
    return null;
  }

  if (typeof onClose !== 'function') {
    console.warn('SettingsModal: onClose prop is required');
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
      console.error('Connection error:', error);
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
        const normalizedData = window.NightingaleDataManagement?.normalizeDataMigrations
          ? await window.NightingaleDataManagement.normalizeDataMigrations(data)
          : data;
        
        if (onDataLoaded) onDataLoaded(normalizedData);
        showToast(`Data loaded successfully! Found ${normalizedData.cases?.length || 0} cases`, 'success');
        onClose();
      } else {
        showToast('No data file found', 'warning');
      }
    } catch (error) {
      console.error('Load data error:', error);
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
      console.error('Create sample error:', error);
      showToast('Error creating sample data', 'error');
    }
  };

  if (!isOpen) return null;

  return e(
    Modal,
    {
      isOpen,
      onClose,
      title: 'Settings & Data Management',
      footerContent: e(
        'div',
        { className: 'flex space-x-3' },
        e(
          'button',
          {
            onClick: onClose,
            className: 'px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors',
          },
          'Close'
        )
      ),
    },
    e(
      'div',
      { className: 'space-y-6' },

      // File System Connection
      e(
        'div',
        { className: 'space-y-4' },
        e('h3', { className: 'text-lg font-semibold text-white' }, 'File System Connection'),
        e(
          'p',
          { className: 'text-gray-400 text-sm' },
          'Connect to your project directory to load and save case data.'
        ),
        e(
          'div',
          { className: 'flex items-center space-x-4' },
          e(
            'button',
            {
              onClick: handleConnect,
              disabled: isConnecting,
              className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                isConnecting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`,
            },
            isConnecting ? 'Connecting...' : 'Connect to Directory'
          ),
          e(
            'div',
            {
              className: `px-3 py-1 rounded-full text-xs font-medium ${
                fileStatus === 'connected' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
              }`,
            },
            fileStatus === 'connected' ? 'Connected' : 'Disconnected'
          )
        )
      ),

      // Data Management
      e(
        'div',
        { className: 'space-y-4' },
        e('h3', { className: 'text-lg font-semibold text-white' }, 'Data Management'),
        e('p', { className: 'text-gray-400 text-sm' }, 'Load existing data or create sample data for testing.'),
        e(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
          e(
            'button',
            {
              onClick: handleLoadData,
              disabled: loadingData || fileStatus !== 'connected',
              className: `px-4 py-3 rounded-lg font-medium transition-colors ${
                loadingData || fileStatus !== 'connected'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`,
            },
            loadingData ? 'Loading...' : 'Load Data File'
          ),
          e(
            'button',
            {
              onClick: handleCreateSample,
              disabled: fileStatus !== 'connected',
              className: `px-4 py-3 rounded-lg font-medium transition-colors ${
                fileStatus !== 'connected'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`,
            },
            'Create Sample Data'
          )
        )
      ),

      // Instructions
      e(
        'div',
        { className: 'space-y-2 p-4 bg-gray-700 rounded-lg' },
        e('h4', { className: 'font-medium text-white' }, 'Instructions:'),
        e(
          'ol',
          {
            className: 'text-sm text-gray-300 space-y-1 list-decimal list-inside',
          },
          e('li', null, "Click 'Connect to Directory' and select your Nightingale project folder"),
          e('li', null, "Use 'Load Data File' to load existing nightingale-data.json"),
          e('li', null, "Or use 'Create Sample Data' to generate test cases for development")
        )
      )
    )
  );
}

// PropTypes for validation
if (typeof window !== 'undefined' && window.PropTypes) {
  SettingsModal.propTypes = {
    isOpen: window.PropTypes.bool.isRequired,
    onClose: window.PropTypes.func.isRequired,
    fileService: window.PropTypes.object,
    onDataLoaded: window.PropTypes.func,
    fileStatus: window.PropTypes.oneOf(['connected', 'disconnected', 'connecting']),
    onFileStatusChange: window.PropTypes.func,
  };
}

// Self-registration for both module and script loading
if (typeof window !== 'undefined') {
  // Register globally for backward compatibility
  window.SettingsModal = SettingsModal;

  // Register with NightingaleBusiness registry if available
  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent('SettingsModal', SettingsModal, 'settings');
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsModal;
}