import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseDetailsView from '../../src/components/business/CaseDetailsView.jsx';

// Minimal stubs for dependent registered components
jest.mock('../../src/services/registry', () => {
  const actual = jest.requireActual('../../src/services/registry');
  return {
    ...actual,
    getComponent: (layer, name) => {
      if (name === 'FinancialManagementSection') {
        return ({ caseData }) => (
          <div data-testid="financial-section">
            FinancialSection for {caseData.id}
          </div>
        );
      }
      if (name === 'NotesModal') {
        return ({ isOpen, onClose }) =>
          isOpen ? (
            <div data-testid="notes-modal">
              NotesModal <button onClick={onClose}>Close Notes</button>
            </div>
          ) : null;
      }
      if (name === 'CaseCreationModal') {
        return ({ isOpen, onClose }) =>
          isOpen ? (
            <div data-testid="edit-modal">
              EditModal <button onClick={onClose}>Close Edit</button>
            </div>
          ) : null;
      }
      return null;
    },
  };
});

// Helper baseline data
const baseCase = {
  id: '101',
  mcn: 'MCN-XYZ',
  status: 'Pending',
  priority: false,
  retroStatus: false,
  notes: [],
};

const fullData = { cases: [baseCase], people: [], organizations: [] };

const noop = () => {};

describe('CaseDetailsView - Batch 1', () => {
  test('returns null when required props missing', () => {
    const { container } = render(<CaseDetailsView />);
    expect(container.firstChild).toBeNull();
  });

  test('renders not-found fallback when caseId does not exist', () => {
    const backSpy = jest.fn();
    render(
      <CaseDetailsView
        caseId="999"
        fullData={fullData}
        onUpdateData={noop}
        onBackToList={backSpy}
      />,
    );

    expect(screen.getByText('Case not found')).toBeInTheDocument();
    const backBtn = screen.getByText('Back to Cases');
    fireEvent.click(backBtn);
    expect(backSpy).toHaveBeenCalled();
  });

  test('smoke: renders existing case header, status, financial section, and action buttons', () => {
    render(
      <CaseDetailsView
        caseId={baseCase.id}
        fullData={fullData}
        onUpdateData={noop}
        onBackToList={noop}
      />,
    );

    // Header MCN
    expect(screen.getByText(/MCN:/)).toHaveTextContent('MCN: MCN-XYZ');
    // Status select initial value
    expect(screen.getByDisplayValue('Pending')).toBeInTheDocument();
    // Notes button with count 0
    expect(screen.getByText('Notes (0)')).toBeInTheDocument();
    // Financial section stub
    expect(screen.getByTestId('financial-section')).toBeInTheDocument();
    // Utility buttons
    expect(screen.getByText('Generate Summary')).toBeInTheDocument();
    expect(screen.getByText('Open VR App')).toBeInTheDocument();
  });
});

describe('CaseDetailsView - Batch 2 interactions', () => {
  const baseCase = {
    id: '202',
    mcn: 'MCN-202',
    status: 'Pending',
    priority: false,
    retroStatus: false,
    notes: [{ id: 1, text: 'First note' }],
  };
  const fullData = { cases: [baseCase], people: [], organizations: [] };

  test('status change triggers onUpdateData with new status', () => {
    const updateSpy = jest.fn();
    render(
      <CaseDetailsView
        caseId={baseCase.id}
        fullData={fullData}
        onUpdateData={updateSpy}
      />,
    );
    const select = screen.getByDisplayValue('Pending');
    fireEvent.change(select, { target: { value: 'Approved' } });
    expect(updateSpy).toHaveBeenCalled();
    const updated = updateSpy.mock.calls[0][0];
    expect(updated.cases[0].status).toBe('Approved');
  });

  test('priority and retro toggles trigger separate updates', () => {
    const updateSpy = jest.fn();
    render(
      <CaseDetailsView
        caseId={baseCase.id}
        fullData={fullData}
        onUpdateData={updateSpy}
      />,
    );
    const [priorityBox, retroBox] = screen.getAllByRole('checkbox');
    fireEvent.click(priorityBox);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy.mock.calls[0][0].cases[0].priority).toBe(true);
    fireEvent.click(retroBox);
    expect(updateSpy).toHaveBeenCalledTimes(2);
    expect(updateSpy.mock.calls[1][0].cases[0].retroStatus).toBe(true);
  });

  test('opens and closes NotesModal when Notes button clicked', () => {
    render(
      <CaseDetailsView
        caseId={baseCase.id}
        fullData={fullData}
        onUpdateData={() => {}}
      />,
    );
    const notesBtn = screen.getByText('Notes (1)');
    fireEvent.click(notesBtn);
    expect(screen.getByTestId('notes-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Notes'));
    expect(screen.queryByTestId('notes-modal')).toBeNull();
  });

  test('clicking name header opens edit modal', () => {
    render(
      <CaseDetailsView
        caseId={baseCase.id}
        fullData={fullData}
        onUpdateData={() => {}}
      />,
    );
    // Name header derived from fallback path since no person object
    // We only have MCN header present; clicking h1 element triggers edit modal
    const editableHeader = screen.getByRole('heading', { level: 1 });
    fireEvent.click(editableHeader);
    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close Edit'));
    expect(screen.queryByTestId('edit-modal')).toBeNull();
  });
});

describe('CaseDetailsView - Batch 3 utilities & edges', () => {
  const utilSpyObj = {
    copyMCN: jest.fn(),
    generateCaseSummary: jest.fn(),
    openVRApp: jest.fn(),
  };
  beforeEach(() => {
    globalThis.NightingaleCMSUtilities = utilSpyObj;
  });
  afterEach(() => {
    utilSpyObj.copyMCN.mockClear();
    utilSpyObj.generateCaseSummary.mockClear();
    utilSpyObj.openVRApp.mockClear();
  });

  const baseCase = {
    id: '303',
    mcn: 'MCN-303',
    status: '',
    priority: false,
    retroStatus: false,
    notes: [],
  };
  const fullData = { cases: [baseCase], people: [], organizations: [] };

  test('Generate Summary button calls utility with caseData', () => {
    render(
      <CaseDetailsView
        caseId="303"
        fullData={fullData}
        onUpdateData={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Generate Summary'));
    expect(utilSpyObj.generateCaseSummary).toHaveBeenCalledTimes(1);
    expect(utilSpyObj.generateCaseSummary.mock.calls[0][0].id).toBe('303');
  });

  test('Open VR App button calls utility with caseData', () => {
    render(
      <CaseDetailsView
        caseId={303}
        fullData={fullData}
        onUpdateData={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Open VR App'));
    expect(utilSpyObj.openVRApp).toHaveBeenCalledTimes(1);
    expect(utilSpyObj.openVRApp.mock.calls[0][0].mcn).toBe('MCN-303');
  });

  test('ID normalization resolves case when caseId numeric stored as string', () => {
    // Provide number 303 while case id is '303'
    render(
      <CaseDetailsView
        caseId={303}
        fullData={fullData}
        onUpdateData={() => {}}
      />,
    );
    expect(screen.getByText(/MCN:/)).toHaveTextContent('MCN-303');
  });

  test('Clicking MCN triggers copyMCN utility', () => {
    render(
      <CaseDetailsView
        caseId="303"
        fullData={fullData}
        onUpdateData={() => {}}
      />,
    );
    const mcnEl = screen.getByText(/MCN: MCN-303/);
    fireEvent.click(mcnEl);
    expect(utilSpyObj.copyMCN).toHaveBeenCalledWith('MCN-303');
  });
});
