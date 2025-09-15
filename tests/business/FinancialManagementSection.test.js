// Clean consolidated test file for FinancialManagementSection (Batches 1-4)
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import FinancialManagementSection from '../../src/components/business/FinancialManagementSection.jsx';
import { registerComponent } from '../../src/services/registry';

// Stub Components
function StubFinancialItemCard(props) {
  return (
    <div data-testid={`financial-item-card-${props.item?.id || 'unknown'}`}>
      <span>{props.item?.name || props.item?.description || 'Unnamed'}</span>
      {props.showActions && (
        <div>
          <button onClick={props.onEdit}>Edit</button>
          {!props.confirmingDelete && (
            <button onClick={props.onDelete}>Delete</button>
          )}
          {props.confirmingDelete && (
            <div>
              <button onClick={props.onDeleteConfirm}>Confirm</button>
              <button onClick={props.onDeleteCancel}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StubFinancialItemModal(props) {
  if (!props.isOpen) return null;
  if (props.editingItem && props.itemType) {
    const updatedItem = {
      ...props.editingItem,
      name: props.editingItem.name + ' (Edited)',
    };
    const updatedCase = {
      ...props.caseData,
      financials: {
        ...props.caseData.financials,
        [props.itemType]: props.caseData.financials[props.itemType].map((it) =>
          it.id === props.editingItem.id ? updatedItem : it,
        ),
      },
    };
    const updatedCases =
      window.NightingaleDataManagement.updateCaseInCollection(
        props.fullData.cases,
        props.caseData.id,
        updatedCase,
      );
    props.onUpdateData({ ...props.fullData, cases: updatedCases });
  } else if (!props.editingItem && props.itemType) {
    const newItem = {
      id: `${props.itemType}-new-1`,
      name: `New ${props.itemType} Item`,
      owner: 'applicant',
    };
    const updatedCase = {
      ...props.caseData,
      financials: {
        ...props.caseData.financials,
        [props.itemType]: [
          ...(props.caseData.financials[props.itemType] || []),
          newItem,
        ],
      },
    };
    const updatedCases =
      window.NightingaleDataManagement.updateCaseInCollection(
        props.fullData.cases,
        props.caseData.id,
        updatedCase,
      );
    props.onUpdateData({ ...props.fullData, cases: updatedCases });
  }
  return <div data-testid="financial-item-modal">Modal Open</div>;
}

function StubAvsImportModal(props) {
  if (!props.isOpen) return null;
  const importedItems = [
    { id: 'avs1', name: 'AVS One', owner: 'applicant' },
    { id: 'avs2', name: 'AVS Two', owner: 'applicant' },
  ];
  props.onImport(importedItems);
  return <div data-testid="avs-import-modal">AVS Import</div>;
}

registerComponent('business', 'FinancialItemCard', StubFinancialItemCard);
registerComponent('business', 'FinancialItemModal', StubFinancialItemModal);
registerComponent('business', 'AvsImportModal', StubAvsImportModal);

beforeAll(() => {
  window.NightingaleDataManagement = {
    updateCaseInCollection: (cases, id, updated) =>
      cases.map((c) => (c.id === id ? updated : c)),
  };
});

// Batch 1 - Smoke & Empty States
describe('FinancialManagementSection - Batch 1 (Smoke & Empty States)', () => {
  const baseCase = {
    id: 'case-1',
    appDetails: { caseType: 'STANDARD' },
    financials: { resources: [], income: [], expenses: [] },
  };
  const fullData = { cases: [baseCase] };
  const onUpdateData = jest.fn();
  const renderSection = (overrides = {}) => {
    const caseData = { ...baseCase, ...overrides };
    return render(
      <FinancialManagementSection
        caseData={caseData}
        fullData={fullData}
        onUpdateData={onUpdateData}
      />,
    );
  };

  test('renders three category containers with empty state messages', () => {
    renderSection();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('No resources items')).toBeInTheDocument();
    expect(screen.getByText('No income items')).toBeInTheDocument();
    expect(screen.getByText('No expenses items')).toBeInTheDocument();
  });

  test('each section has an Add button (standard case)', () => {
    renderSection();
    expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(3);
  });

  test('resources section shows AVS Import button only for resources', () => {
    renderSection();
    expect(
      screen.getByTitle('Import financial data from AVS'),
    ).toBeInTheDocument();
    const importLabelButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent.includes('Import AVS'));
    expect(importLabelButtons).toHaveLength(1);
  });

  test('SIMP case renders accordion sections instead of direct grid', () => {
    renderSection({ appDetails: { caseType: 'SIMP' } });
    expect(screen.getByText('Applicant Financials')).toBeInTheDocument();
    expect(screen.getByText('Joint Financials')).toBeInTheDocument();
    expect(screen.getByText('Spouse Financials')).toBeInTheDocument();
    expect(screen.queryByText('Resources')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Applicant Financials'));
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });
});

// Batch 2 - Add Item Flows
describe('FinancialManagementSection - Batch 2 (Add Item Flows)', () => {
  const baseCase = {
    id: 'case-2',
    appDetails: { caseType: 'STANDARD' },
    financials: { resources: [], income: [], expenses: [] },
  };
  const buildFullData = (override = {}) => ({
    cases: [{ ...baseCase, ...override }],
  });
  let onUpdateData;
  const renderSection = (override = {}) => {
    const fullData = buildFullData(override);
    const caseData = fullData.cases[0];
    return render(
      <FinancialManagementSection
        caseData={caseData}
        fullData={fullData}
        onUpdateData={onUpdateData}
      />,
    );
  };
  beforeEach(() => {
    onUpdateData = jest.fn();
  });

  test('adding resource item triggers onUpdateData with new resource appended', () => {
    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    expect(updatedCase.financials.resources[0].id).toBe('resources-new-1');
  });

  test('adding income item does not affect other categories', () => {
    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[1]);
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    expect(updatedCase.financials.income).toHaveLength(1);
    expect(updatedCase.financials.resources).toHaveLength(0);
    expect(updatedCase.financials.expenses).toHaveLength(0);
  });

  test('adding expense item preserves existing resource', () => {
    renderSection({
      financials: {
        resources: [{ id: 'r1', name: 'Existing Resource' }],
        income: [],
        expenses: [],
      },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[2]);
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    expect(updatedCase.financials.resources).toHaveLength(1);
    expect(updatedCase.financials.expenses[0].id).toBe('expenses-new-1');
  });

  test('SIMP accordion add flow updates resources', () => {
    renderSection({ appDetails: { caseType: 'SIMP' } });
    fireEvent.click(screen.getByText('Applicant Financials'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    expect(updatedCase.financials.resources).toHaveLength(1);
  });
});

// Batch 3 - Edit & Delete
describe('FinancialManagementSection - Batch 3 (Edit & Delete Flows)', () => {
  const baseCase = {
    id: 'case-3',
    appDetails: { caseType: 'STANDARD' },
    financials: {
      resources: [
        { id: 'res1', name: 'Resource One' },
        { id: 'res2', name: 'Resource Two' },
      ],
      income: [{ id: 'inc1', name: 'Income One' }],
      expenses: [{ id: 'exp1', name: 'Expense One' }],
    },
  };
  const buildFullData = (override = {}) => ({
    cases: [{ ...baseCase, ...override }],
  });
  let onUpdateData;
  const renderSection = (override = {}) => {
    const fullData = buildFullData(override);
    const caseData = fullData.cases[0];
    return render(
      <FinancialManagementSection
        caseData={caseData}
        fullData={fullData}
        onUpdateData={onUpdateData}
      />,
    );
  };
  beforeEach(() => {
    onUpdateData = jest.fn();
  });

  test('editing a resource item replaces only that item', () => {
    renderSection();
    fireEvent.click(
      within(screen.getByTestId('financial-item-card-res1')).getByText('Edit'),
    );
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    const res1 = updatedCase.financials.resources.find((r) => r.id === 'res1');
    const res2 = updatedCase.financials.resources.find((r) => r.id === 'res2');
    expect(res1.name).toBe('Resource One (Edited)');
    expect(res2.name).toBe('Resource Two');
  });

  test('deleting a resource item after confirm removes it', () => {
    renderSection();
    const card = screen.getByTestId('financial-item-card-res2');
    fireEvent.click(within(card).getByText('Delete'));
    fireEvent.click(within(card).getByText('Confirm'));
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    expect(updatedCase.financials.resources.some((r) => r.id === 'res2')).toBe(
      false,
    );
  });

  test('cancel delete does not call onUpdateData', () => {
    renderSection();
    const card = screen.getByTestId('financial-item-card-res1');
    fireEvent.click(within(card).getByText('Delete'));
    fireEvent.click(within(card).getByText('Cancel'));
    expect(onUpdateData).not.toHaveBeenCalled();
  });

  test('SIMP accordion delete flow for applicant resource', () => {
    renderSection({
      appDetails: { caseType: 'SIMP' },
      financials: {
        ...baseCase.financials,
        resources: [
          { id: 'resA', name: 'Applicant Resource', owner: 'applicant' },
        ],
      },
    });
    fireEvent.click(screen.getByText('Applicant Financials'));
    const card = screen.getByTestId('financial-item-card-resA');
    fireEvent.click(within(card).getByText('Delete'));
    fireEvent.click(within(card).getByText('Confirm'));
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    expect(updatedCase.financials.resources.some((r) => r.id === 'resA')).toBe(
      false,
    );
  });
});

// Batch 4 - Show More, AVS Import, Edge Items
describe('FinancialManagementSection - Batch 4 (Show More, AVS Import, Edge Items)', () => {
  beforeEach(() => {
    window.NightingaleUtils = {
      transformFinancialItems: jest.fn((items) =>
        items.map((it) => ({ ...it, id: `transformed-${it.id}` })),
      ),
    };
    window.NightingaleToast = { showSuccessToast: jest.fn() };
  });

  const buildResources = (count) =>
    Array.from({ length: count }).map((_, i) => ({
      id: `res${i + 1}`,
      name: `Resource ${i + 1}`,
    }));

  const renderWithCase = (override = {}) => {
    const base = {
      id: 'case-b4',
      appDetails: { caseType: 'STANDARD' },
      financials: { resources: [], income: [], expenses: [] },
      ...override,
    };
    const fullData = { cases: [base] };
    const onUpdateData = jest.fn();
    render(
      <FinancialManagementSection
        caseData={base}
        fullData={fullData}
        onUpdateData={onUpdateData}
      />,
    );
    return { onUpdateData };
  };

  test('show more / show less toggles visibility beyond 3 items', () => {
    renderWithCase({
      financials: { resources: buildResources(5), income: [], expenses: [] },
    });
    expect(screen.getAllByTestId(/financial-item-card-res\d+/).length).toBe(3);
    fireEvent.click(
      screen.getByRole('button', { name: /Show More \(2 more\)/ }),
    );
    expect(screen.getAllByTestId(/financial-item-card-res\d+/).length).toBe(5);
    fireEvent.click(
      screen.getByRole('button', { name: /Show Less \(2 hidden\)/ }),
    );
    expect(screen.getAllByTestId(/financial-item-card-res\d+/).length).toBe(3);
  });

  test('show more label correct for exactly 4 items (1 more)', () => {
    renderWithCase({
      financials: { resources: buildResources(4), income: [], expenses: [] },
    });
    screen.getByRole('button', { name: /Show More \(1 more\)/ });
  });

  test('SIMP accordion + show more works inside applicant section', () => {
    const resources = buildResources(5).map((r) => ({
      ...r,
      owner: 'applicant',
    }));
    renderWithCase({
      appDetails: { caseType: 'SIMP' },
      financials: { resources, income: [], expenses: [] },
    });
    fireEvent.click(screen.getByText('Applicant Financials'));
    expect(screen.getAllByTestId(/financial-item-card-res\d+/).length).toBe(3);
    fireEvent.click(
      screen.getByRole('button', { name: /Show More \(2 more\)/ }),
    );
    expect(screen.getAllByTestId(/financial-item-card-res\d+/).length).toBe(5);
  });

  test('AVS import adds transformed items and shows success toast', () => {
    const { onUpdateData } = renderWithCase();
    fireEvent.click(screen.getByTitle('Import financial data from AVS'));
    expect(onUpdateData).toHaveBeenCalled();
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    expect(updatedCase.financials.resources).toHaveLength(2);
    expect(updatedCase.financials.resources[0].id).toMatch(/^transformed-avs/);
    expect(
      window.NightingaleUtils.transformFinancialItems,
    ).toHaveBeenCalledTimes(1);
    expect(window.NightingaleToast.showSuccessToast).toHaveBeenCalled();
    expect(window.NightingaleToast.showSuccessToast.mock.calls[0][0]).toMatch(
      /Successfully imported 2 financial items from AVS/,
    );
  });

  test('zero and negative amount items still render', () => {
    const resources = [
      { id: 'zr1', name: 'Zero Amount', amount: 0 },
      { id: 'nr1', name: 'Negative Amount', amount: -50 },
    ];
    renderWithCase({ financials: { resources, income: [], expenses: [] } });
    expect(screen.getByTestId('financial-item-card-zr1')).toBeInTheDocument();
    expect(screen.getByTestId('financial-item-card-nr1')).toBeInTheDocument();
  });
});

// Branch Top-Up Tests
describe('FinancialManagementSection - Branch Top-Up', () => {
  beforeEach(() => {
    window.NightingaleDataManagement = {
      updateCaseInCollection: (cases, id, updated) =>
        cases.map((c) => (c.id === id ? updated : c)),
    };
  });

  function baseRender(rawCase) {
    const caseData = rawCase;
    const fullData = { cases: [caseData] };
    const onUpdateData = jest.fn();
    render(
      <FinancialManagementSection
        caseData={caseData}
        fullData={fullData}
        onUpdateData={onUpdateData}
      />,
    );
    return { onUpdateData, caseData };
  }

  test('initializes missing financials structure when absent', () => {
    const { caseData } = baseRender({
      id: 'case-missing',
      appDetails: { caseType: 'STANDARD' },
    });
    // The component mutates to ensure arrays exist; verify subsequent Add works.
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    // Presence of modal stub proves structure allowed open (handled in stub add side-effect if we had provided itemType logic)
    // Just assert empty state text existed beforehand (ensures arrays treated as empty rather than crash)
    expect(screen.getByText('No resources items')).toBeInTheDocument();
    expect(caseData.financials).toBeTruthy();
    expect(Array.isArray(caseData.financials.resources)).toBe(true);
  });

  test('AVS import without transform function uses original items', () => {
    // Provide object without transform to exercise fallback path safely
    window.NightingaleUtils = {}; // transformFinancialItems undefined
    window.NightingaleToast = { showSuccessToast: jest.fn() };
    const { onUpdateData } = baseRender({
      id: 'case-avs-fallback',
      appDetails: { caseType: 'STANDARD' },
      financials: { resources: [], income: [], expenses: [] },
    });
    fireEvent.click(screen.getByTitle('Import financial data from AVS'));
    expect(onUpdateData).toHaveBeenCalled();
    const updatedCase = onUpdateData.mock.calls[0][0].cases[0];
    // IDs should remain original (avs1, avs2) since no transform occurred
    expect(updatedCase.financials.resources.map((r) => r.id)).toEqual([
      'avs1',
      'avs2',
    ]);
  });

  test('SIMP accordion owner with zero items shows 0 items and expands to empty tables', () => {
    const caseData = {
      id: 'case-simp-empty-owner',
      appDetails: { caseType: 'SIMP' },
      financials: { resources: [], income: [], expenses: [] },
    };
    baseRender(caseData);
    const applicantHeader = screen.getByText('Applicant Financials');
    // There are three "0 items" (applicant/joint/spouse); ensure at least one
    expect(screen.getAllByText('0 items').length).toBe(3);
    fireEvent.click(applicantHeader);
    // After expansion we should see empty state messages for each category
    expect(screen.getByText('No resources items')).toBeInTheDocument();
    expect(screen.getByText('No income items')).toBeInTheDocument();
    expect(screen.getByText('No expenses items')).toBeInTheDocument();
  });

  test('AVS import singular grammar when one item imported', () => {
    window.NightingaleUtils = {
      transformFinancialItems: jest.fn((items) => items.slice(0, 1)),
    }; // force single result
    window.NightingaleToast = { showSuccessToast: jest.fn() };
    const { onUpdateData } = baseRender({
      id: 'case-avs-single',
      appDetails: { caseType: 'STANDARD' },
      financials: { resources: [], income: [], expenses: [] },
    });
    fireEvent.click(screen.getByTitle('Import financial data from AVS'));
    expect(onUpdateData).toHaveBeenCalled();
    expect(window.NightingaleToast.showSuccessToast).toHaveBeenCalled();
    const msg = window.NightingaleToast.showSuccessToast.mock.calls[0][0];
    expect(msg).toMatch(/Successfully imported 1 financial item from AVS/);
    expect(msg).not.toMatch(/items from AVS$/); // ensure no plural 'items' suffix
  });
});
