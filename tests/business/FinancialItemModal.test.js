import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Mock toast early so component picks it up
jest.mock('../../src/services/nightingale.toast.js', () => ({
  __esModule: true,
  default: { showToast: jest.fn() },
}));
import FinancialItemModal from '../../src/components/business/FinancialItemModal.jsx';
import '../../src/components/ui/Modal.jsx'; // ensure Modal registered

// Basic smoke test: renders modal with required fields for a new income item

describe('FinancialItemModal - Smoke', () => {
  const baseCase = {
    id: 1,
    appDetails: { caseType: 'STANDARD' },
    financials: { income: [], resources: [], expenses: [] },
  };
  const fullData = { cases: [baseCase] };
  const noop = () => {};

  test('renders Add Income Item with core inputs', () => {
    render(
      <FinancialItemModal
        isOpen
        onClose={noop}
        caseData={baseCase}
        fullData={fullData}
        onUpdateData={noop}
        itemType="income"
      />,
    );

    // Title
    expect(screen.getByText('Add Income Item')).toBeInTheDocument();

    // Required description label and input placeholder sample
    expect(screen.getByText('Item Name *')).toBeInTheDocument();
    // Amount label
    expect(screen.getByText('Amount')).toBeInTheDocument();

    // Frequency label present and monthly option rendered
    expect(screen.getByText('Freq')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '/mo' })).toBeInTheDocument();

    // Verification Status select
    // Verification Status label present
    expect(screen.getByText('Verification Status')).toBeInTheDocument();

    // Save button text
    expect(screen.getByText('Save Item')).toBeInTheDocument();
  });
});

describe('FinancialItemModal - Validation', () => {
  const baseCase = {
    id: 2,
    appDetails: { caseType: 'STANDARD' },
    financials: { income: [], resources: [], expenses: [] },
  };
  const fullData = { cases: [baseCase] };

  test('shows validation errors for empty description and negative amount then clears after fix', async () => {
    const updateSpy = jest.fn();
    render(
      <FinancialItemModal
        isOpen
        onClose={() => {}}
        caseData={baseCase}
        fullData={fullData}
        onUpdateData={updateSpy}
        itemType="income"
      />,
    );

    // Set negative amount (already 0 so change to -5)
    const amountInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(amountInput, { target: { value: '-5' } });

    // Submit without description
    const form = document.querySelector('form');
    fireEvent.submit(form);

    // Wait for both validation errors
    expect(
      await screen.findByText(/Description is required/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Amount cannot be negative/),
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();

    // Fix fields
    const descriptionInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(descriptionInput, { target: { value: 'Pension' } });
    fireEvent.change(amountInput, { target: { value: '123.45' } });

    fireEvent.submit(form);

    // Errors cleared (wait for rerender)
    await screen.findByText('Add Income Item'); // anchor wait (modal still open prior to close trigger)
    expect(screen.queryByText('Description is required')).toBeNull();
    expect(screen.queryByText('Amount cannot be negative')).toBeNull();
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});

describe('FinancialItemModal - Create', () => {
  const baseCase = {
    id: 3,
    appDetails: { caseType: 'STANDARD' },
    financials: { income: [], resources: [], expenses: [] },
  };
  const fullData = { cases: [baseCase] };
  const toastMod = require('../../src/services/nightingale.toast.js').default;

  test('creates new income item storing legacy fields and closes', () => {
    const updateSpy = jest.fn((data) => data);
    const closeSpy = jest.fn();

    render(
      <FinancialItemModal
        isOpen
        onClose={closeSpy}
        caseData={baseCase}
        fullData={fullData}
        onUpdateData={updateSpy}
        itemType="income"
      />,
    );

    // Fill description & amount only (minimal required)
    const descriptionInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(descriptionInput, {
      target: { value: 'Social Security' },
    });
    const amountInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(amountInput, { target: { value: '999.99' } });

    fireEvent.click(screen.getByText('Save Item'));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updatedData = updateSpy.mock.calls[0][0];
    const newIncome = updatedData.cases[0].financials.income[0];
    expect(newIncome.description).toBe('Social Security');
    // Backward compatibility fields
    expect(newIncome.type).toBe('Social Security');
    expect(newIncome.amount).toBe(999.99);
    expect(newIncome.value).toBe(999.99);
    expect(newIncome.source).toBe('');

    expect(toastMod.showToast).toHaveBeenCalledWith(
      'income item saved successfully.',
      'success',
    );
    expect(closeSpy).toHaveBeenCalled();
  });
});

describe('FinancialItemModal - AddAnother', () => {
  const baseCase = {
    id: 4,
    appDetails: { caseType: 'STANDARD' },
    financials: { resources: [], income: [], expenses: [] },
  };
  const fullData = { cases: [baseCase] };
  const toastMod = require('../../src/services/nightingale.toast.js').default;

  test('saves new resources item and resets form with addAnother enabled', () => {
    const updateSpy = jest.fn((d) => d);
    const closeSpy = jest.fn();
    render(
      <FinancialItemModal
        isOpen
        onClose={closeSpy}
        caseData={baseCase}
        fullData={fullData}
        onUpdateData={updateSpy}
        itemType="resources"
      />,
    );

    // Enable add another
    fireEvent.click(screen.getByRole('checkbox'));

    // Fill description & amount
    const descriptionInput = screen.getAllByRole('textbox')[0];
    const amountInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(descriptionInput, {
      target: { value: 'Checking Account' },
    });
    fireEvent.change(amountInput, { target: { value: '1500' } });

    fireEvent.click(screen.getByText('Save Item'));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(toastMod.showToast).toHaveBeenCalledWith(
      'resources item saved. Add another.',
      'success',
    );
    // Modal not closed
    expect(closeSpy).not.toHaveBeenCalled();
    // Form reset - description empty & amount 0
    const newDescriptionInput = screen.getAllByRole('textbox')[0];
    const newAmountInput = screen.getAllByRole('spinbutton')[0];
    expect(newDescriptionInput.value).toBe('');
    expect(newAmountInput.value).toBe('0');
  });
});

describe('FinancialItemModal - Edit', () => {
  const existingItem = {
    id: 55,
    description: 'Rent',
    amount: 1200,
    frequency: 'monthly',
    verificationStatus: 'Needs VR',
    verificationSource: '',
    owner: 'applicant',
    dateAdded: '2024-01-01T00:00:00.000Z',
  };
  const baseCase = {
    id: 5,
    appDetails: { caseType: 'STANDARD' },
    financials: { expenses: [existingItem], income: [], resources: [] },
  };
  const fullData = { cases: [baseCase] };
  const toastMod = require('../../src/services/nightingale.toast.js').default;

  test('edits existing expenses item and closes', () => {
    const updateSpy = jest.fn((d) => d);
    const closeSpy = jest.fn();
    render(
      <FinancialItemModal
        isOpen
        onClose={closeSpy}
        caseData={baseCase}
        fullData={fullData}
        onUpdateData={updateSpy}
        itemType="expenses"
        editingItem={existingItem}
      />,
    );

    // Title reflects edit
    expect(screen.getByText('Edit Expenses Item')).toBeInTheDocument();

    // Change description & amount
    const descriptionInput = screen.getAllByRole('textbox')[0];
    const amountInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(descriptionInput, { target: { value: 'Updated Rent' } });
    fireEvent.change(amountInput, { target: { value: '1300' } });

    fireEvent.click(screen.getByText('Update Item'));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const updatedData = updateSpy.mock.calls[0][0];
    const updatedItem = updatedData.cases[0].financials.expenses[0];
    expect(updatedItem.description).toBe('Updated Rent');
    expect(updatedItem.type).toBe('Updated Rent'); // legacy
    expect(updatedItem.amount).toBe(1300);
    expect(updatedItem.value).toBe(1300); // legacy
    expect(toastMod.showToast).toHaveBeenCalledWith(
      'expenses item updated successfully.',
      'success',
    );
    expect(closeSpy).toHaveBeenCalled();
  });
});

describe('FinancialItemModal - Verification Source', () => {
  const baseCase = {
    id: 6,
    appDetails: { caseType: 'STANDARD' },
    financials: { income: [], resources: [], expenses: [] },
  };
  const fullData = { cases: [baseCase] };
  const toastMod = require('../../src/services/nightingale.toast.js').default;

  test('requires verification source when status set to Verified', async () => {
    const updateSpy = jest.fn();
    render(
      <FinancialItemModal
        isOpen
        onClose={() => {}}
        caseData={baseCase}
        fullData={fullData}
        onUpdateData={updateSpy}
        itemType="income"
      />,
    );

    // Fill minimal required fields
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Pension' },
    });
    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '500' },
    });

    // Change verification status to Verified
    const selects = screen.getAllByRole('combobox');
    const verificationSelect = selects[1]; // second select: verification status
    fireEvent.change(verificationSelect, { target: { value: 'Verified' } });

    // Attempt save without source
    fireEvent.click(screen.getByText('Save Item'));
    expect(
      await screen.findByText(/Verification source is required/),
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();

    // Provide source (use placeholder to target the field) and save again
    const sourceInput = screen.getByPlaceholderText(
      'e.g., Bank Statement 05/2025, Award Letter',
    );
    fireEvent.change(sourceInput, { target: { value: 'Bank Statement Jan' } });
    fireEvent.click(screen.getByText('Save Item'));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(toastMod.showToast).toHaveBeenCalledWith(
      'income item saved successfully.',
      'success',
    );
  });
});

describe('FinancialItemModal - Failure Path', () => {
  const baseCase = {
    id: 7,
    appDetails: { caseType: 'STANDARD' },
    financials: { income: [], resources: [], expenses: [] },
  };
  const fullData = { cases: [baseCase] };
  const toastMod = require('../../src/services/nightingale.toast.js').default;

  test('shows error toast and stays open when update throws', () => {
    const updateSpy = jest.fn(() => {
      throw new Error('write failed');
    });
    const closeSpy = jest.fn();
    render(
      <FinancialItemModal
        isOpen
        onClose={closeSpy}
        caseData={baseCase}
        fullData={fullData}
        onUpdateData={updateSpy}
        itemType="income"
      />,
    );

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Side Job' },
    });
    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '200' },
    });

    fireEvent.click(screen.getByText('Save Item'));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(toastMod.showToast).toHaveBeenCalledWith(
      'Failed to save income item.',
      'error',
    );
    // Modal should remain open (title still present)
    expect(screen.getByText('Add Income Item')).toBeInTheDocument();
    expect(closeSpy).not.toHaveBeenCalled();
  });
});
