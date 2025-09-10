/* eslint-disable react/prop-types */
/**
 * Nightingale Component Library - FinancialItemCard
 * Layer: Business (Domain-Specific)
 *
 * Display financial items in the case details view using the generic Card UI component.
 * Handles financial item display with Nightingale CMS business logic and formatting.
 *
 * Preview-style card designed for financial management sections.
 * Migrated to ES module component registry.
 */
import React, { useMemo, useCallback } from 'react';
import { registerComponent } from '../../services/registry';
function FinancialItemCard({
  item,
  itemType,
  onEdit = () => {},
  onDelete = () => {},
  onDeleteConfirm = () => {},
  onDeleteCancel = () => {},
  confirmingDelete = false,
  showActions = true,
}) {
  const e = React.createElement;

  // Get verification status text for Badge component
  const getVerificationStatus = useMemo(() => {
    if (!item) return { text: 'Pending' };

    const status = (item.verificationStatus || 'pending').toLowerCase();
    const statusMap = {
      verified: { text: 'Verified' },
      pending: { text: 'VR Pending' },
      unverified: { text: 'Needs VR' },
      'not-required': { text: 'Review Pending' },
      'needs-vr': { text: 'Needs VR' },
      'vr-pending': { text: 'VR Pending' },
      'review-pending': { text: 'Review Pending' },
      'avs-pending': { text: 'AVS Pending' },
      'avs pending': { text: 'AVS Pending' },
    };

    let badgeText = statusMap[status] || statusMap.pending;

    // Append verification source in parentheses for verified items
    if (status === 'verified' && item.verificationSource) {
      badgeText = { text: `${badgeText.text} (${item.verificationSource})` };
    }

    return badgeText;
  }, [item]);

  // Format currency amounts with frequency
  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount);
  };

  // Format frequency display for income/expense items
  const formatFrequency = (frequency) => {
    const frequencyMap = {
      monthly: '/mo',
      yearly: '/yr',
      weekly: '/wk',
      daily: '/day',
      'one-time': ' (1x)',
    };
    return frequencyMap[frequency] || '';
  };

  // Format account number to show only last 4 digits
  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    // Extract only the last 4 digits
    const digits = accountNumber.replace(/\D/g, ''); // Remove non-digits
    if (digits.length <= 4) return digits;
    return digits.slice(-4);
  };

  // Get display amount with frequency (but not for resources)
  const getDisplayAmount = useMemo(() => {
    if (!item) return '$0';

    const amount = item.amount || item.value || 0;
    const baseAmount = formatCurrency(amount);

    // Only show frequency for income and expense items, not resources
    if (item.frequency && itemType !== 'resources') {
      return baseAmount + formatFrequency(item.frequency);
    }

    return baseAmount;
  }, [item, itemType]);

  // Handle delete button click
  const handleDeleteClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (confirmingDelete) {
        onDeleteCancel();
      } else {
        onDelete(item);
      }
    },
    [confirmingDelete, onDeleteCancel, onDelete, item],
  );

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(
    (e) => {
      e.stopPropagation();
      onDeleteConfirm(item);
    },
    [onDeleteConfirm, item],
  );

  // Card content for preview display
  const cardContent = useMemo(() => {
    if (!item) return null;

    return e(
      'div',
      { className: 'space-y-2' },

      // Top row: Description and Amount
      e(
        'div',
        { className: 'flex justify-between items-start' },
        e(
          'div',
          { className: 'flex-1' },
          e(
            'h6',
            { className: 'font-medium text-gray-200 text-sm' },
            item.description || item.type || 'Untitled Item',
          ),
        ),
        e(
          'div',
          { className: 'text-gray-200 font-medium text-sm ml-3' },
          getDisplayAmount,
        ),
      ),

      // Second row: Institution (if available)
      item.location &&
        e('div', { className: 'text-xs text-gray-400' }, item.location),

      // Third row: Account Number with Badge
      e(
        'div',
        { className: 'flex justify-between items-center' },
        // Account Number (if available, showing only last 4 digits)
        item.accountNumber
          ? e(
              'div',
              { className: 'text-xs text-gray-400' },
              formatAccountNumber(item.accountNumber),
            )
          : e('div'), // Empty div to maintain flex layout
        // Badge - right side
        e(window.Badge, {
          status: getVerificationStatus.text,
          variant: 'verification',
          size: 'sm',
        }),
      ),

      // Action buttons (only shown when confirming delete)
      showActions &&
        confirmingDelete &&
        e(
          'div',
          {
            className:
              'flex justify-end space-x-1 pt-2 border-t border-gray-600',
          },
          // Confirm button (green check)
          e(window.Button, {
            variant: 'success',
            size: 'sm',
            onClick: handleDeleteConfirm,
            children: '✓',
          }),
          // Cancel button (red X)
          e(window.Button, {
            variant: 'danger',
            size: 'sm',
            onClick: handleDeleteClick,
            children: '✗',
          }),
        ),
    );
  }, [
    item,
    getDisplayAmount,
    getVerificationStatus,
    showActions,
    confirmingDelete,
    handleDeleteConfirm,
    handleDeleteClick,
    e,
  ]);

  // Don't render if no item provided
  if (!item) return null;

  // Return the card with preview styling
  return e(
    'div',
    {
      className: [
        'bg-gray-700 border border-gray-600 p-4 rounded-lg cursor-pointer',
        'hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200',
        'hover:border-gray-500',
      ].join(' '),
      onClick: () => onEdit(item),
    },
    cardContent,
  );
}

/**
 * FinancialItemList - Display multiple financial items in a list layout
 */
function FinancialItemList({
  items = [],
  itemType,
  onEdit = () => {},
  onDelete = () => {},
  onDeleteConfirm = () => {},
  onDeleteCancel = () => {},
  confirmingDelete = null,
  onAdd = () => {},
  title = 'Financial Items',
  interactive = true,
  showActions = true,
}) {
  const e = React.createElement;

  return e(
    'div',
    { className: 'space-y-3' },

    // Header with add button
    e(
      'div',
      { className: 'flex justify-between items-center' },
      e('h4', { className: 'text-md font-bold text-blue-400' }, title),
      e(
        'button',
        {
          onClick: () => onAdd(itemType),
          className:
            'bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md',
        },
        'Add',
      ),
    ),

    // Items list
    items.length === 0
      ? e(
          'p',
          { className: 'text-gray-500 text-sm text-center py-4' },
          `No ${itemType || 'financial'} items`,
        )
      : e(
          'div',
          { className: 'space-y-2' },
          items.map((item) =>
            e(FinancialItemCard, {
              key: item.id,
              item,
              itemType,
              onEdit,
              onDelete,
              onDeleteConfirm,
              onDeleteCancel,
              confirmingDelete: confirmingDelete === item.id,
              interactive,
              showActions,
            }),
          ),
        ),
  );
}

/**
 * FinancialItemGrid - Display multiple financial items in a responsive grid layout
 */
function FinancialItemGrid({
  items = [],
  itemType,
  onEdit = () => {},
  onDelete = () => {},
  onDeleteConfirm = () => {},
  onDeleteCancel = () => {},
  confirmingDelete = null,
  onAdd = () => {},
  title = 'Financial Items',
  interactive = true,
  showActions = true,
  columns = 'auto', // 'auto', 1, 2, 3, 4
}) {
  const e = React.createElement;

  // Determine grid columns class
  const getGridClass = () => {
    if (columns === 'auto') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return `grid-cols-${columns}`;
  };

  return e(
    'div',
    { className: 'space-y-3' },

    // Header with add button
    e(
      'div',
      { className: 'flex justify-between items-center' },
      e('h4', { className: 'text-md font-bold text-blue-400' }, title),
      e(
        'button',
        {
          onClick: () => onAdd(itemType),
          className:
            'bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md',
        },
        'Add',
      ),
    ),

    // Items grid
    items.length === 0
      ? e(
          'p',
          { className: 'text-gray-500 text-sm text-center py-8' },
          `No ${itemType || 'financial'} items`,
        )
      : e(
          'div',
          { className: `grid ${getGridClass()} gap-3` },
          items.map((item) =>
            e(FinancialItemCard, {
              key: item.id,
              item,
              itemType,
              onEdit,
              onDelete,
              onDeleteConfirm,
              onDeleteCancel,
              confirmingDelete: confirmingDelete === item.id,
              interactive,
              showActions,
            }),
          ),
        ),
  );
}

// Register components with the business component system
// Register with business registry (legacy global removal)
registerComponent('business', 'FinancialItemCard', FinancialItemCard);
registerComponent('business', 'FinancialItemList', FinancialItemList);
registerComponent('business', 'FinancialItemGrid', FinancialItemGrid);

// Export for ES6 modules

// ES6 Module Export
export default FinancialItemCard;
export { FinancialItemCard, FinancialItemList, FinancialItemGrid };
