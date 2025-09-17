/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Provide global React for legacy createElement usage inside components
window.React = React;

// Import base UI components (Modal / StepperModal) so they self-register
import '../../src/components/ui/Modal.jsx';
import '../../src/components/ui/StepperModal.jsx';
import '../../src/components/ui/FormComponents.jsx'; // includes FormField, TextInput, Select, DateInput

// Stub SearchBar (simplifies selection logic for tests)
import { registerComponent } from '../../src/services/registry';
function SearchBarStub({
  data = [],
  onResultSelect,
  value,
  onChange,
  placeholder,
}) {
  const e = React.createElement;
  return e(
    'div',
    null,
    e('input', { placeholder, value, onChange }),
    e(
      'button',
      {
        type: 'button',
        onClick: () => {
          if (onResultSelect && data.length > 0) onResultSelect(data[0]);
        },
      },
      'Choose First Result',
    ),
  );
}
registerComponent('ui', 'SearchBar', SearchBarStub);

// Business component under test
import CaseCreationModal from '../../src/components/business/CaseCreationModal.jsx';

// Minimal helper to create a fake file service with controllable data
function createFileService({ initialData } = {}) {
  const data = initialData || {
    people: [
      { id: 'p1', name: 'Alice Example' },
      { id: 'p2', name: 'Bob Example' },
    ],
    organizations: [{ id: 'org1', name: 'Org One' }],
    cases: [],
  };
  return {
    readFile: jest.fn().mockResolvedValue(data),
    writeFile: jest.fn().mockResolvedValue(true),
  };
}

describe('CaseCreationModal (business)', () => {
  test('renders when open and shows first step title', () => {
    const fileService = createFileService();
    render(
      <CaseCreationModal
        isOpen
        fullData={
          fileService.readFile.mock.results[0]?.value || {
            people: [],
            organizations: [],
            cases: [],
          }
        }
        fileService={fileService}
        requireFields={true}
      />,
    );
    // Stepper title
    expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
    // Primary step input label
    expect(screen.getByText(/Master Case Number/i)).toBeInTheDocument();
  });

  test('shows validation errors when attempting to advance with empty required fields', async () => {
    const fileService = createFileService();
    render(
      <CaseCreationModal
        isOpen
        fullData={{ people: [], organizations: [], cases: [] }}
        fileService={fileService}
        requireFields={true}
      />,
    );
    // Attempt to go to next step
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Only MCN and Retro Requested are empty/invalid by default (caseType + applicationDate pre-populated)
    await waitFor(() => {
      expect(screen.getByText(/MCN is required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Retro requested selection is required/i),
      ).toBeInTheDocument();
    });

    // Still on first step
    expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
  });

  test('completes creation workflow with minimal required data', async () => {
    const fileService = createFileService();
    const onCaseCreated = jest.fn();
    const onClose = jest.fn();
    const fullData = {
      people: [
        {
          id: 'p1',
          name: 'Alice Example',
          livingArrangement: '',
          organizationId: null,
        },
        { id: 'p2', name: 'Bob Example' },
      ],
      organizations: [{ id: 'org1', name: 'Org One' }],
      cases: [],
    };

    render(
      <CaseCreationModal
        isOpen
        fullData={fullData}
        fileService={fileService}
        onCaseCreated={onCaseCreated}
        onClose={onClose}
        requireFields={true}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter MCN/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/Retro Requested/i), {
      target: { value: 'Yes' },
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    // Use getAllByText to avoid multiple match error
    await waitFor(() =>
      expect(screen.getAllByText(/Select Client/i).length).toBeGreaterThan(0),
    );

    fireEvent.click(
      screen.getAllByRole('button', { name: /Choose First Result/i })[0],
    );

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    // Wait for any Living Arrangement label to appear (multiple variants exist)
    await waitFor(() =>
      expect(screen.getAllByText(/Living Arrangement/i).length).toBeGreaterThan(
        0,
      ),
    );

    const livingSelect = screen.getAllByLabelText(/Living Arrangement/i)[0];
    fireEvent.change(livingSelect, { target: { value: 'Other' } });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByText(/Review Case Details/i));

    fireEvent.click(screen.getByRole('button', { name: /Create Case/i }));

    await waitFor(() => expect(onCaseCreated).toHaveBeenCalled());
    expect(fileService.writeFile).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    const createdCase = onCaseCreated.mock.calls[0][0];
    expect(createdCase.mcn).toBe('12345');
    expect(createdCase.personId).toBe('p1');
  });
});
