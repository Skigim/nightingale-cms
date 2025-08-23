/* eslint-disable react/prop-types */
/**
 * Nightingale CMS - AVS Data Import Modal
 *
 * A business component for importing and merging AVS (Asset Verification System) data
 * with existing financial resources. Follows React best practices and Nightingale CMS
 * component architecture patterns.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onImport - Callback when import is completed with selected items
 * @param {string} props.masterCaseId - The case ID for context
 * @param {string} props.ownerFilter - Owner filter for data comparison ("applicant" | "spouse" | "both")
 * @param {Array} props.existingResources - Array of existing financial resources for comparison
 * @returns {React.Element|null} The AVS import modal component
 */
function AvsImportModal({
  isOpen,
  onClose,
  onImport,
  masterCaseId,
  ownerFilter = 'applicant', // Reserved for future filtering logic
  existingResources = [],
}) {
  const e = window.React.createElement;
  const { useState, useCallback, useMemo, useEffect } = window.React;

  // Component state following React purity rules
  const [rawData, setRawData] = useState('');
  const [previewItems, setPreviewItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Note: ownerFilter reserved for future filtering functionality
  console.debug('AvsImportModal initialized for:', {
    masterCaseId,
    ownerFilter,
  });

  // Known account types - memoized for performance
  const knownAccountTypes = useMemo(
    () => [
      'Checking Account',
      'Savings Account',
      'Money Market Account',
      'Certificate of Deposit',
      'Investment Account',
      'Retirement Account',
      'Trust Account',
      'Joint Account',
    ],
    []
  );

  /**
   * Compare parsed accounts with existing resources to identify duplicates and new items
   * @param {Array} parsedAccounts - Newly parsed account data
   * @param {Array} existing - Existing financial resources
   * @returns {Array} Enhanced account data with comparison metadata
   */
  const compareWithExistingResources = useCallback(
    (parsedAccounts, existing) => {
      return parsedAccounts.map((account, index) => {
        // Check for potential duplicates based on account number and institution
        const potentialDuplicate = existing.find(
          (existingItem) =>
            existingItem.accountNumber === account.accountNumber &&
            existingItem.location?.toLowerCase() ===
              account.location?.toLowerCase()
        );

        return {
          ...account,
          id: `avs-${masterCaseId}-${index}`,
          isNew: !potentialDuplicate,
          isDuplicate: !!potentialDuplicate,
          existingItem: potentialDuplicate || null,
          importAction: potentialDuplicate ? 'update' : 'create',
        };
      });
    },
    [masterCaseId]
  );

  /**
   * Parse AVS data and compare with existing resources
   * Handles errors gracefully and provides user feedback
   */
  const handleParseData = useCallback(async () => {
    if (!rawData.trim()) {
      setError('Please enter AVS data to parse');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use global parser service (loaded via script tags)
      if (!window.parseAvsData) {
        throw new Error('AVS parser service not available');
      }

      const parsedAccounts = window.parseAvsData(rawData, knownAccountTypes);

      if (!parsedAccounts || parsedAccounts.length === 0) {
        setError(
          'No valid account data found. Please check the AVS data format.'
        );
        setPreviewItems([]);
        return;
      }

      // Compare with existing resources
      const comparisonResults = compareWithExistingResources(
        parsedAccounts,
        existingResources
      );

      setPreviewItems(comparisonResults);

      // Auto-select new items by default
      const newItemIds = comparisonResults
        .filter((item) => item.isNew)
        .map((item) => item.id);
      setSelectedItems(new Set(newItemIds));
    } catch (err) {
      setError(
        'Failed to parse AVS data. Please check the format and try again.'
      );
      console.error('AVS parsing error:', err);
      setPreviewItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    rawData,
    knownAccountTypes,
    existingResources,
    compareWithExistingResources,
  ]);

  /**
   * Handle final import of selected items
   * Validates selection and calls parent callback
   */
  const handleImport = useCallback(
    (event) => {
      event.preventDefault();

      const itemsToImport = previewItems.filter((item) =>
        selectedItems.has(item.id)
      );

      if (itemsToImport.length === 0) {
        setError('Please select at least one item to import');
        return;
      }

      // Clear error and proceed with import
      setError(null);
      onImport(itemsToImport);
      onClose();
    },
    [previewItems, selectedItems, onImport, onClose]
  );

  /**
   * Toggle selection of an individual item
   */
  const handleToggleItem = useCallback((itemId) => {
    setSelectedItems((prevSelected) => {
      const newSelection = new Set(prevSelected);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, []);

  /**
   * Select or deselect all items
   */
  const handleToggleAll = useCallback(() => {
    const allItemIds = previewItems.map((item) => item.id);
    const allSelected = allItemIds.every((id) => selectedItems.has(id));

    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItemIds));
    }
  }, [previewItems, selectedItems]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRawData('');
      setPreviewItems([]);
      setSelectedItems(new Set());
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  // Calculate selection statistics
  const totalItems = previewItems.length;
  const selectedCount = selectedItems.size;
  const newItemsCount = previewItems.filter((item) => item.isNew).length;
  const duplicateItemsCount = previewItems.filter(
    (item) => item.isDuplicate
  ).length;

  return e(
    window.Modal,
    {
      isOpen,
      onClose,
      title: 'Import & Merge AVS Resources',
      size: 'large',
      className: 'avs-import-modal',
    },
    e(
      'form',
      {
        onSubmit: handleImport,
        className: 'space-y-6',
        'aria-label': 'AVS Data Import Form',
      },
      // Instructions and raw data input section
      e(
        'div',
        { className: 'space-y-4' },
        e(
          'div',
          { className: 'bg-gray-800 border border-gray-600 rounded-md p-4' },
          e(
            'h4',
            { className: 'text-sm font-medium text-blue-400 mb-2' },
            'Instructions'
          ),
          e(
            'p',
            { className: 'text-sm text-gray-300' },
            'Paste your raw AVS data below. The system will parse account information and compare it with existing financial resources to identify new items and potential duplicates.'
          )
        ),

        e(
          window.FormField,
          {
            label: 'Paste Raw AVS Data',
            required: true,
            error: error && !previewItems.length ? error : null,
            hint: 'Copy the entire AVS report and paste it here',
          },
          e(window.Textarea, {
            value: rawData,
            onChange: (e) => setRawData(e.target.value),
            placeholder:
              'Paste your AVS data here...\n\nAccount Owner: John Doe Checking Account\nFirst National Bank - (1234)\nBalance as of 08/22/2025 - $1,500.00\n\nAccount Owner: Jane Doe Savings Account\n...',
            rows: 8,
            className: 'font-mono text-sm',
            'aria-describedby': 'avs-data-hint',
          })
        ),

        e(
          'div',
          { className: 'flex justify-start' },
          e(
            window.Button,
            {
              type: 'button',
              onClick: handleParseData,
              disabled: isLoading || !rawData.trim(),
              variant: 'secondary',
              loading: isLoading,
              icon: 'search',
            },
            'Parse & Compare Data'
          )
        )
      ),

      // Error display for parsing/import errors
      error &&
        previewItems.length === 0 &&
        e(
          'div',
          {
            className: 'bg-red-50 border border-red-200 rounded-md p-4',
            role: 'alert',
          },
          e(
            'div',
            { className: 'flex' },
            e('div', { className: 'text-sm text-red-700' }, error)
          )
        ),

      // Preview section
      previewItems.length > 0 &&
        e(
          'div',
          { className: 'space-y-4' },
          // Summary header
          e(
            'div',
            { className: 'flex justify-between items-center' },
            e(
              'h4',
              { className: 'text-lg font-medium text-gray-100' },
              'Import Preview'
            ),
            e(
              'div',
              { className: 'text-sm text-gray-400' },
              `${selectedCount} of ${totalItems} selected | ${newItemsCount} new | ${duplicateItemsCount} duplicates`
            )
          ),

          // Select all toggle
          totalItems > 1 &&
            e(
              'div',
              { className: 'flex items-center space-x-2' },
              e('input', {
                type: 'checkbox',
                checked: selectedCount === totalItems,
                onChange: handleToggleAll,
                className:
                  'h-4 w-4 text-blue-600 focus:ring-blue-500 bg-gray-700 border-gray-600 rounded',
                'aria-label': 'Select all items',
              }),
              e(
                'label',
                { className: 'text-sm font-medium text-gray-300' },
                'Select All'
              )
            ),

          // Preview list
          e(PreviewList, {
            items: previewItems,
            selectedItems,
            onToggleItem: handleToggleItem,
          }),

          // Import error (different from parse error)
          error &&
            e(
              'div',
              {
                className: 'bg-red-900 border border-red-700 rounded-md p-3',
                role: 'alert',
              },
              e('div', { className: 'text-sm text-red-300' }, error)
            )
        ),

      // Footer with action buttons
      e(
        'div',
        {
          className: 'flex justify-end space-x-3 pt-4 border-t border-gray-600',
        },
        e(
          window.Button,
          {
            type: 'button',
            onClick: onClose,
            variant: 'secondary',
          },
          'Cancel'
        ),

        previewItems.length > 0 &&
          e(ImportButton, {
            disabled: selectedCount === 0,
            selectedCount,
          })
      )
    )
  );
}

/**
 * Import button component - separated for potential useFormStatus integration
 * @param {Object} props - Component props
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {number} props.selectedCount - Number of selected items
 */
function ImportButton({ disabled, selectedCount }) {
  const e = window.React.createElement;

  // Future: This is where useFormStatus would be integrated when available
  // const { pending } = window.ReactDOM.useFormStatus();

  const buttonText =
    selectedCount > 0
      ? `Import ${selectedCount} Selected Item${selectedCount !== 1 ? 's' : ''}`
      : 'Import Selected';

  return e(
    window.Button,
    {
      type: 'submit',
      disabled,
      variant: 'primary',
      icon: selectedCount > 0 ? 'download' : 'check',
    },
    buttonText
  );
}

/**
 * Preview list component for displaying parsed AVS items
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of preview items
 * @param {Set} props.selectedItems - Set of selected item IDs
 * @param {Function} props.onToggleItem - Callback for toggling item selection
 */
function PreviewList({ items, selectedItems, onToggleItem }) {
  const e = window.React.createElement;

  return e(
    'div',
    {
      className:
        'space-y-2 max-h-60 overflow-y-auto border border-gray-600 rounded-md p-2 bg-gray-800',
      'aria-label': 'Preview of parsed AVS data',
    },
    items.map((item) =>
      e(PreviewItem, {
        key: item.id,
        item,
        isSelected: selectedItems.has(item.id),
        onToggle: () => onToggleItem(item.id),
      })
    )
  );
}

/**
 * Individual preview item component
 * @param {Object} props - Component props
 * @param {Object} props.item - The preview item data
 * @param {boolean} props.isSelected - Whether the item is selected
 * @param {Function} props.onToggle - Callback for toggling selection
 */
function PreviewItem({ item, isSelected, onToggle }) {
  const e = window.React.createElement;

  // Format currency value
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(item.value || 0);

  // Status indicator based on comparison results
  const statusIndicator = item.isNew
    ? e(
        'span',
        {
          className:
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300 border border-green-700',
        },
        'New'
      )
    : e(
        'span',
        {
          className:
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300 border border-yellow-700',
        },
        'Update'
      );

  return e(
    'div',
    {
      className: `flex items-center space-x-3 p-3 border rounded-md transition-colors ${
        isSelected
          ? 'bg-blue-900 border-blue-600'
          : 'bg-gray-700 border-gray-600'
      } hover:bg-blue-800`,
      'aria-label': `AVS account: ${item.type} at ${item.location}`,
    },
    e('input', {
      type: 'checkbox',
      checked: isSelected,
      onChange: onToggle,
      className:
        'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
      'aria-label': `Select ${item.type} account`,
    }),

    e('input', {
      type: 'checkbox',
      checked: item.selected,
      onChange: (e) => onToggle(item.id, e.target.checked),
      className:
        'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700',
      'aria-label': `Select ${item.type} account`,
    }),

    e(
      'div',
      { className: 'flex-1 min-w-0' },
      e(
        'div',
        { className: 'flex items-center space-x-2 mb-1' },
        e(
          'span',
          { className: 'font-medium text-white' },
          `${item.type} - ${item.location}`
        ),
        statusIndicator
      ),
      e(
        'div',
        { className: 'text-sm text-gray-300' },
        `Owner: ${item.owner || 'Unknown'} | Account: ***${item.accountNumber || 'Unknown'} | Balance: ${formattedValue}`
      ),
      item.source &&
        e(
          'div',
          { className: 'text-xs text-gray-400 mt-1' },
          `Source: ${item.source}`
        )
    )
  );
}

// Component registration following Nightingale CMS patterns
if (typeof window !== 'undefined') {
  window.AvsImportModal = AvsImportModal;

  // Register with business component registry if available
  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'AvsImportModal',
      AvsImportModal
    );
  }
}
