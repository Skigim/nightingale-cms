/**
 * AVS Import Modal - Integration Test & Usage Example
 *
 * This file demonstrates how to integrate and use the AvsImportModal component
 * with sample data and mock functions for testing purposes.
 */

// Sample AVS raw data for testing
const SAMPLE_AVS_DATA = `Account Owner: John Doe Checking Account
First National Bank - (1234)
Balance as of 08/22/2025 - $1,500.00

Account Owner: Jane Doe Savings Account
Community Credit Union - (5678)
Balance as of 08/22/2025 - $3,250.50

Account Owner: John Doe; Jane Doe Joint Account
Wells Fargo Bank - (9999)
Balance as of 08/22/2025 - $12,750.25

Account Owner: Jane Doe Investment Account
Charles Schwab - (4567)
Balance as of 08/22/2025 - $45,320.75`;

// Sample existing resources for comparison
const SAMPLE_EXISTING_RESOURCES = [
  {
    id: 'existing-1',
    type: 'Checking',
    owner: 'John Doe',
    location: 'First National Bank',
    accountNumber: '1234',
    value: 1200.0,
    verificationStatus: 'Pending',
    source: 'Manual Entry',
  },
  {
    id: 'existing-2',
    type: 'Savings',
    owner: 'Jane Doe',
    location: 'Different Bank',
    accountNumber: '9876',
    value: 2500.0,
    verificationStatus: 'Verified',
    source: 'Bank Statement',
  },
];

/**
 * Test function to demonstrate AvsImportModal usage
 * This would typically be called from a button click in the main application
 */
function testAvsImportModal() {
  const e = window.React.createElement;
  const { useState } = window.React;

  function AvsImportTest() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [importedData, setImportedData] = useState([]);

    const handleImport = (selectedItems) => {
      console.log('📥 Importing AVS data:', selectedItems);
      setImportedData(selectedItems);

      // In a real application, this would:
      // 1. Validate the imported data
      // 2. Transform it to match your data model
      // 3. Update the global state/database
      // 4. Show success notification

      // For testing, just log the results
      window.NightingaleToast?.show({
        message: `Successfully imported ${selectedItems.length} financial item${selectedItems.length !== 1 ? 's' : ''}`,
        type: 'success',
      });
    };

    const handleClose = () => {
      setIsModalOpen(false);
    };

    return e(
      'div',
      { className: 'p-4 space-y-4' },
      e('h2', { className: 'text-xl font-bold' }, 'AVS Import Modal Test'),

      e(
        'div',
        { className: 'space-y-2' },
        e(
          'button',
          {
            onClick: () => setIsModalOpen(true),
            className:
              'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700',
          },
          'Open AVS Import Modal'
        ),

        e(
          'button',
          {
            onClick: () => {
              // Auto-fill with sample data for testing
              setIsModalOpen(true);
              setTimeout(() => {
                const textarea = document.querySelector(
                  'textarea[placeholder*="AVS"]'
                );
                if (textarea) {
                  textarea.value = SAMPLE_AVS_DATA;
                  textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }, 100);
            },
            className:
              'ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700',
          },
          'Test with Sample Data'
        )
      ),

      // Display imported results
      importedData.length > 0 &&
        e(
          'div',
          { className: 'border border-gray-300 rounded p-4' },
          e('h3', { className: 'font-semibold mb-2' }, 'Last Import Results:'),
          e(
            'pre',
            { className: 'text-sm bg-gray-100 p-2 rounded overflow-auto' },
            JSON.stringify(importedData, null, 2)
          )
        ),

      // The modal component
      e(window.AvsImportModal, {
        isOpen: isModalOpen,
        onClose: handleClose,
        onImport: handleImport,
        masterCaseId: 'TEST-001',
        ownerFilter: 'applicant',
        existingResources: SAMPLE_EXISTING_RESOURCES,
      })
    );
  }

  // Mount the test component
  const container = document.createElement('div');
  container.id = 'avs-import-test';
  document.body.appendChild(container);

  const root = window.ReactDOM.createRoot(container);
  root.render(e(AvsImportTest));

  return container;
}

/**
 * Validation function to check if all required dependencies are loaded
 */
function validateAvsImportDependencies() {
  const required = [
    'React',
    'ReactDOM',
    'AvsImportModal',
    'parseAvsData',
    'Modal',
    'Button',
    'FormField',
  ];

  const missing = required.filter((dep) => !window[dep]);

  if (missing.length > 0) {
    console.error('❌ Missing dependencies for AVS Import Modal:', missing);
    return false;
  }

  console.log('✅ All AVS Import Modal dependencies are loaded');
  return true;
}

/**
 * Integration test function
 * Call this after all components are loaded to test the modal
 */
function runAvsImportIntegrationTest() {
  console.log('🧪 Starting AVS Import Modal integration test...');

  if (!validateAvsImportDependencies()) {
    console.error('❌ Cannot run test - missing dependencies');
    return false;
  }

  try {
    const testContainer = testAvsImportModal();
    console.log('✅ AVS Import Modal test initialized successfully');
    console.log('📋 Test container added to DOM:', testContainer.id);
    return true;
  } catch (error) {
    console.error('❌ AVS Import Modal test failed:', error);
    return false;
  }
}

// Auto-run test when all components are ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for business components to be ready
  if (window.NightingaleBusiness) {
    window.addEventListener('nightingale:business:ready', () => {
      setTimeout(() => runAvsImportIntegrationTest(), 1000);
    });
  } else {
    // Fallback: try after a delay
    setTimeout(() => {
      if (window.AvsImportModal) {
        runAvsImportIntegrationTest();
      }
    }, 2000);
  }
});

// Make test functions available globally for manual testing
if (typeof window !== 'undefined') {
  window.testAvsImportModal = testAvsImportModal;
  window.runAvsImportIntegrationTest = runAvsImportIntegrationTest;
  window.SAMPLE_AVS_DATA = SAMPLE_AVS_DATA;
}
