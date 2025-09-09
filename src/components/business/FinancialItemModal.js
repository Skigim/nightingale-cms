/**
 * FinancialItemModal - Business Component for Managing Financial Items
 *
 * Handles creation and editing of financial items (resources, income, expenses)
 * with validation, owner assignment, and verification tracking.
 * Migrated to ES module component registry.
 *
 * @component FinancialItemModal
 */
import { registerComponent } from '../../services/core';

function FinancialItemModal({
  isOpen,
  onClose,
  caseData,
  fullData,
  onUpdateData,
  itemType,
  editingItem = null,
}) {
  const e = window.React.createElement;
  const { useState, useEffect } = window.React;

  // Toast function - now guaranteed to work by main.js setup
  const showToast = window.showToast;

  const [formData, setFormData] = useState({
    id: editingItem?.id || null,
    description: editingItem?.description || editingItem?.type || '', // Migrate type → description
    location: editingItem?.location || '',
    accountNumber: editingItem?.accountNumber || '',
    amount: editingItem?.amount || editingItem?.value || 0, // Migrate value → amount
    frequency: editingItem?.frequency || 'monthly',
    owner: editingItem?.owner || 'applicant',
    verificationStatus: editingItem?.verificationStatus || 'Needs VR',
    verificationSource:
      editingItem?.verificationSource || editingItem?.source || '', // Migrate source → verificationSource
    notes: editingItem?.notes || '',
    dateAdded: editingItem?.dateAdded || new Date().toISOString(),
  });
  const [addAnother, setAddAnother] = useState(false);
  const [errors, setErrors] = useState({});

  const isSimpCase = caseData.appDetails?.caseType === 'SIMP';
  const isEditing = !!editingItem;

  // Reset form when modal opens/closes or editing item changes
  useEffect(() => {
    if (isOpen && editingItem) {
      setFormData({
        id: editingItem.id,
        description: editingItem.description || editingItem.type || '', // Handle legacy type field
        location: editingItem.location || '',
        accountNumber: editingItem.accountNumber || '',
        amount: editingItem.amount || editingItem.value || 0, // Handle legacy value field
        frequency: editingItem.frequency || 'monthly',
        owner: editingItem.owner || 'applicant',
        verificationStatus: editingItem.verificationStatus || 'Needs VR',
        verificationSource:
          editingItem.verificationSource || editingItem.source || '', // Handle legacy source field
        notes: editingItem.notes || '',
        dateAdded: editingItem.dateAdded || new Date().toISOString(),
      });
    } else if (isOpen && !editingItem) {
      setFormData({
        id: null,
        description: '',
        location: '',
        accountNumber: '',
        amount: 0,
        frequency: 'monthly',
        owner: 'applicant',
        verificationStatus: 'Needs VR',
        verificationSource: '',
        notes: '',
        dateAdded: new Date().toISOString(),
      });
    }
    setErrors({});
    setAddAnother(false);
  }, [isOpen, editingItem]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.amount < 0) {
      newErrors.amount = 'Amount cannot be negative';
    }

    if (
      formData.verificationStatus === 'Verified' &&
      !formData.verificationSource.trim()
    ) {
      newErrors.verificationSource =
        'Verification source is required when status is Verified';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const itemData = {
      ...formData,
      id: formData.id || Date.now(),
      amount: parseFloat(formData.amount) || 0,
      // Store both description and type for backward compatibility
      description: formData.description,
      type: formData.description, // Ensure CMSOld compatibility
      // Store both amount and value for backward compatibility
      value: parseFloat(formData.amount) || 0, // Ensure CMSOld compatibility
      // Store both verificationSource and source for backward compatibility
      source: formData.verificationSource, // Ensure CMSOld compatibility
    };

    // Update the case data
    const updatedFinancials = { ...caseData.financials };
    if (!updatedFinancials[itemType]) {
      updatedFinancials[itemType] = [];
    }

    if (isEditing) {
      // Update existing item
      updatedFinancials[itemType] = updatedFinancials[itemType].map((item) =>
        item.id === itemData.id ? itemData : item,
      );
    } else {
      // Add new item
      updatedFinancials[itemType].push(itemData);
    }

    const updatedCase = {
      ...caseData,
      financials: updatedFinancials,
    };

    const updatedCases = fullData.cases.map((c) =>
      c.id === caseData.id ? updatedCase : c,
    );

    onUpdateData({ ...fullData, cases: updatedCases });

    if (addAnother && !isEditing) {
      // Reset form for another item
      setFormData({
        id: null,
        description: '',
        location: '',
        accountNumber: '',
        amount: 0,
        frequency: 'monthly',
        owner: 'applicant',
        verificationStatus: 'Needs VR',
        verificationSource: '',
        notes: '',
        dateAdded: new Date().toISOString(),
      });
      setErrors({});
      showToast(`${itemType} item saved. Add another.`, 'success');
    } else {
      showToast(
        `${itemType} item ${isEditing ? 'updated' : 'saved'} successfully.`,
        'success',
      );
      onClose();
    }
  };

  const getPlaceholders = () => {
    const placeholders = {
      resources: {
        description: 'e.g., Checking Account, Savings Account, CD',
        location: 'e.g., Bank of America, Wells Fargo',
      },
      income: {
        description: 'e.g., Social Security, Pension, Employment',
        location: 'e.g., SSA, ABC Company, State Retirement',
      },
      expenses: {
        description: 'e.g., Medicare Part B, Rent, Utilities',
        location: 'e.g., Medicare, Landlord Name, Electric Company',
      },
    };
    return placeholders[itemType] || placeholders.resources;
  };

  const placeholders = getPlaceholders();

  const footerContent = e(
    window.React.Fragment,
    {},
    e(
      'button',
      {
        onClick: onClose,
        className:
          'px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg',
      },
      'Cancel',
    ),
    e(
      'button',
      {
        onClick: handleSave,
        className:
          'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg',
      },
      isEditing ? 'Update Item' : 'Save Item',
    ),
  );

  return e(window.Modal, {
    isOpen,
    onClose,
    title: `${isEditing ? 'Edit' : 'Add'} ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Item`,
    size: 'large',
    footerContent,
    children: e(
      'div',
      { className: 'space-y-6' },

      // Form Grid
      e(
        'div',
        { className: 'space-y-4' },

        // Row 1: Description and Location/Institution
        e(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },

          // Description
          e(
            'div',
            {},
            e(
              'label',
              {
                className: 'block text-sm font-medium text-gray-400 mb-2',
              },
              'Item Name *',
            ),
            e('input', {
              type: 'text',
              value: formData.description,
              onChange: (e) => updateFormData('description', e.target.value),
              placeholder: placeholders.description,
              className: `w-full bg-gray-700 border rounded-md px-3 py-2 text-white ${
                errors.description ? 'border-red-500' : 'border-gray-600'
              }`,
            }),
            errors.description &&
              e(
                'p',
                { className: 'text-red-400 text-sm mt-1' },
                errors.description,
              ),
          ),

          // Location/Institution
          e(
            'div',
            {},
            e(
              'label',
              {
                className: 'block text-sm font-medium text-gray-400 mb-2',
              },
              'Location/Institution',
            ),
            e('input', {
              type: 'text',
              value: formData.location,
              onChange: (e) => updateFormData('location', e.target.value),
              placeholder: placeholders.location,
              className:
                'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white',
            }),
          ),
        ),

        // Row 2: Account Number, Amount, and Frequency (conditional)
        e(
          'div',
          {
            className: 'grid gap-4',
            style: {
              gridTemplateColumns:
                itemType === 'income' || itemType === 'expenses'
                  ? '3fr 3fr 1fr'
                  : '1fr 1fr',
            },
          },

          // Account Number (for resources, income, and expenses)
          (itemType === 'resources' ||
            itemType === 'income' ||
            itemType === 'expenses') &&
            e(
              'div',
              {},
              e(
                'label',
                {
                  className: 'block text-sm font-medium text-gray-400 mb-2',
                },
                'Account Number',
              ),
              e('input', {
                type: 'text',
                value: formData.accountNumber,
                onChange: (e) =>
                  updateFormData('accountNumber', e.target.value),
                placeholder: 'Last 4 digits: 1234',
                className:
                  'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white',
              }),
            ),

          // Amount
          e(
            'div',
            {},
            e(
              'label',
              {
                className: 'block text-sm font-medium text-gray-400 mb-2',
              },
              'Amount',
            ),
            e('input', {
              type: 'number',
              value: formData.amount,
              onChange: (e) => updateFormData('amount', e.target.value),
              min: '0',
              step: '0.01',
              className: `w-full bg-gray-700 border rounded-md px-3 py-2 text-white ${
                errors.amount ? 'border-red-500' : 'border-gray-600'
              }`,
            }),
            errors.amount &&
              e('p', { className: 'text-red-400 text-sm mt-1' }, errors.amount),
          ),

          // Frequency (for income/expenses)
          (itemType === 'income' || itemType === 'expenses') &&
            e(
              'div',
              {},
              e(
                'label',
                {
                  className: 'block text-sm font-medium text-gray-400 mb-2',
                },
                'Freq',
              ),
              e(
                'select',
                {
                  value: formData.frequency,
                  onChange: (e) => updateFormData('frequency', e.target.value),
                  className:
                    'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm',
                },
                e('option', { value: 'monthly' }, '/mo'),
                e('option', { value: 'yearly' }, '/yr'),
                e('option', { value: 'weekly' }, '/wk'),
                e('option', { value: 'daily' }, '/day'),
                e('option', { value: 'one-time' }, '1x'),
              ),
            ),
        ),

        // Row 3: Verification Status and Verification Source (conditional)
        e(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },

          // Verification Status
          e(
            'div',
            {},
            e(
              'label',
              {
                className: 'block text-sm font-medium text-gray-400 mb-2',
              },
              'Verification Status',
            ),
            e(
              'select',
              {
                value: formData.verificationStatus,
                onChange: (e) =>
                  updateFormData('verificationStatus', e.target.value),
                className:
                  'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white',
              },
              e('option', { value: 'Needs VR' }, 'Needs VR'),
              e('option', { value: 'VR Pending' }, 'VR Pending'),
              e('option', { value: 'AVS Pending' }, 'AVS Pending'),
              e('option', { value: 'Verified' }, 'Verified'),
            ),
          ),

          // Verification Source (conditional)
          e(
            'div',
            {},
            e(
              'label',
              {
                className: 'block text-sm font-medium text-gray-400 mb-2',
              },
              'Verification Source',
            ),
            e('input', {
              type: 'text',
              value: formData.verificationSource,
              onChange: (e) =>
                updateFormData('verificationSource', e.target.value),
              placeholder: 'e.g., Bank Statement 05/2025, Award Letter',
              disabled: formData.verificationStatus !== 'Verified',
              className: `w-full border rounded-md px-3 py-2 ${
                formData.verificationStatus !== 'Verified'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 text-white'
              } ${errors.verificationSource ? 'border-red-500' : 'border-gray-600'}`,
            }),
            errors.verificationSource &&
              e(
                'p',
                { className: 'text-red-400 text-sm mt-1' },
                errors.verificationSource,
              ),
          ),
        ),

        // Additional fields for specific types
        isSimpCase &&
          e(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },

            // Owner (for SIMP cases)
            e(
              'div',
              {},
              e(
                'label',
                {
                  className: 'block text-sm font-medium text-gray-400 mb-2',
                },
                'Owner',
              ),
              e(
                'select',
                {
                  value: formData.owner,
                  onChange: (e) => updateFormData('owner', e.target.value),
                  className:
                    'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white',
                },
                e('option', { value: 'applicant' }, 'Applicant'),
                e('option', { value: 'spouse' }, 'Spouse'),
                e('option', { value: 'joint' }, 'Joint'),
              ),
            ),
            e('div', {}), // Empty div to maintain grid
          ),

        // Notes (full width)
        e(
          'div',
          {},
          e(
            'label',
            { className: 'block text-sm font-medium text-gray-400 mb-2' },
            'Item Notes',
          ),
          e('textarea', {
            value: formData.notes,
            onChange: (e) => updateFormData('notes', e.target.value),
            placeholder: 'Additional notes about this item...',
            rows: 3,
            className:
              'w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white',
          }),
        ),

        // Add Another (for new items only)
        !isEditing &&
          e(
            'div',
            {},
            e(
              'label',
              { className: 'flex items-center' },
              e('input', {
                type: 'checkbox',
                checked: addAnother,
                onChange: (e) => setAddAnother(e.target.checked),
                className: 'h-4 w-4 rounded mr-3',
              }),
              e(
                'span',
                { className: 'text-gray-300' },
                'Add another item after saving',
              ),
            ),
          ),
      ),
    ),
  });
}

// Register component globally and with NightingaleBusiness registry
if (typeof window !== 'undefined') {
  window.FinancialItemModal = FinancialItemModal; // legacy global
  registerComponent('business', 'FinancialItemModal', FinancialItemModal);
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinancialItemModal;
}

// ES6 Module Export
export default FinancialItemModal;
