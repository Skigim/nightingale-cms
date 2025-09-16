import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FinancialItemCard from '../../src/components/business/FinancialItemCard.jsx';

// Mock registry components
jest.mock('../../src/services/registry', () => ({
  registerComponent: jest.fn(),
  getComponent: jest.fn((registryName, componentName) => {
    if (registryName === 'ui' && componentName === 'Badge') {
      return ({ status, variant, size }) => (
        <span
          data-testid="badge"
          data-status={status}
          data-variant={variant}
          data-size={size}
        >
          {status}
        </span>
      );
    }
    if (registryName === 'ui' && componentName === 'Button') {
      return ({ variant, size, onClick, children }) => (
        <button
          data-testid="button"
          data-variant={variant}
          data-size={size}
          onClick={onClick}
        >
          {children}
        </button>
      );
    }
    return null;
  }),
}));

const mockItem = {
  id: 'test-1',
  description: 'Test Savings Account',
  location: 'Test Bank',
  accountNumber: '123456789',
  amount: 1500.75,
  verificationStatus: 'verified',
  verificationSource: 'Bank Statement',
};

describe('FinancialItemCard', () => {
  test('renders without crashing with minimal props', () => {
    render(<FinancialItemCard item={mockItem} />);
  });

  test('displays account type, masked account number, and formatted currency', () => {
    const { getByText } = render(
      <FinancialItemCard
        item={mockItem}
        itemType="resources"
      />,
    );

    expect(getByText('Test Savings Account')).toBeInTheDocument();
    expect(getByText('6789')).toBeInTheDocument(); // Last 4 digits of account number
    expect(getByText('$1,500.75')).toBeInTheDocument(); // Formatted currency
    expect(getByText('Test Bank')).toBeInTheDocument();
  });

  test('formats currency with frequency for income items', () => {
    const incomeItem = {
      ...mockItem,
      amount: 2500,
      frequency: 'monthly',
    };

    const { getByText } = render(
      <FinancialItemCard
        item={incomeItem}
        itemType="income"
      />,
    );
    expect(getByText('$2,500.00/mo')).toBeInTheDocument();
  });

  test('displays verification status badge', () => {
    const { getByTestId } = render(<FinancialItemCard item={mockItem} />);

    const badge = getByTestId('badge');
    expect(badge).toHaveAttribute('data-status', 'Verified (Bank Statement)');
    expect(badge).toHaveAttribute('data-variant', 'verification');
  });

  test('handles delete action flow', () => {
    const onDelete = jest.fn();
    const onDeleteConfirm = jest.fn();
    const onDeleteCancel = jest.fn();

    const { getByTestId, queryByTestId } = render(
      <FinancialItemCard
        item={mockItem}
        onDelete={onDelete}
        onDeleteConfirm={onDeleteConfirm}
        onDeleteCancel={onDeleteCancel}
        confirmingDelete={false}
      />,
    );

    // Initially no confirmation buttons should be visible
    expect(queryByTestId('button')).not.toBeInTheDocument();
  });

  test('shows confirmation buttons when confirming delete', () => {
    const onDeleteConfirm = jest.fn();

    const { getAllByTestId } = render(
      <FinancialItemCard
        item={mockItem}
        onDeleteConfirm={onDeleteConfirm}
        confirmingDelete={true}
      />,
    );

    const buttons = getAllByTestId('button');
    expect(buttons).toHaveLength(2); // Confirm and cancel buttons

    fireEvent.click(buttons[0]); // Click confirm button
    expect(onDeleteConfirm).toHaveBeenCalledWith(mockItem);
  });

  test('calls onEdit when card is clicked', () => {
    const onEdit = jest.fn();

    const { container } = render(
      <FinancialItemCard
        item={mockItem}
        onEdit={onEdit}
      />,
    );

    const card = container.firstChild;
    fireEvent.click(card);
    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });

  test('returns null when no item provided', () => {
    const { container } = render(<FinancialItemCard item={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('handles items without account number gracefully', () => {
    const itemWithoutAccount = { ...mockItem, accountNumber: null };
    const { container } = render(
      <FinancialItemCard item={itemWithoutAccount} />,
    );

    // Should render without crashing
    expect(container.firstChild).not.toBeNull();
  });

  test('handles different verification statuses', () => {
    const pendingItem = { ...mockItem, verificationStatus: 'pending' };
    const { getByTestId } = render(<FinancialItemCard item={pendingItem} />);

    const badge = getByTestId('badge');
    expect(badge).toHaveAttribute('data-status', 'VR Pending');
  });
});
