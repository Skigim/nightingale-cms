/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Import the component
require('../CaseDetailsView.js');

describe('CaseDetailsView Component', () => {
  const mockCase = {
    id: 'case-123',
    personId: 'person-1',
    status: 'Active',
    serviceType: 'VR',
    dateCreated: '2024-01-15',
    notes: 'Initial assessment completed',
  };

  const mockPerson = {
    id: 'person-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  const mockFullData = {
    cases: [mockCase],
    people: [mockPerson],
    organizations: [],
  };

  const defaultProps = {
    caseId: 'case-123',
    fullData: mockFullData,
    onUpdateData: jest.fn(),
    onBackToList: jest.fn(),
  };

  beforeEach(() => {
    // Ensure React is available globally
    global.window = window;
    window.React = React;

    // Mock required services
    window.NightingaleDataManagement = {
      findPersonById: jest.fn((people, personId) =>
        people?.find((p) => p.id === personId)
      ),
    };

    // Mock required components
    window.CaseCreationModal = () =>
      React.createElement('div', { 'data-testid': 'case-creation-modal' });
    window.FinancialManagementSection = () =>
      React.createElement('div', { 'data-testid': 'financial-section' });
    window.NotesModal = () =>
      React.createElement('div', { 'data-testid': 'notes-modal' });

    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const Component = window.CaseDetailsView;
    expect(Component).toBeDefined();

    render(React.createElement(Component, defaultProps));
  });

  test('displays case information', () => {
    const Component = window.CaseDetailsView;

    render(React.createElement(Component, defaultProps));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('VR')).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    const mockOnBack = jest.fn();
    const Component = window.CaseDetailsView;

    render(
      React.createElement(Component, {
        ...defaultProps,
        onBack: mockOnBack,
      })
    );

    const backButton = screen.getByText(/back/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  test('enters edit mode when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    const Component = window.CaseDetailsView;

    render(
      React.createElement(Component, {
        ...defaultProps,
        onEdit: mockOnEdit,
      })
    );

    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalled();
  });

  test('shows editable fields when in editing mode', () => {
    const Component = window.CaseDetailsView;

    render(
      React.createElement(Component, {
        ...defaultProps,
        isEditing: true,
      })
    );

    // Look for form inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  test('calls onSave when save button is clicked in edit mode', () => {
    const mockOnSave = jest.fn();
    const Component = window.CaseDetailsView;

    render(
      React.createElement(Component, {
        ...defaultProps,
        isEditing: true,
        onSave: mockOnSave,
      })
    );

    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  test('displays notes section', () => {
    const Component = window.CaseDetailsView;

    render(React.createElement(Component, defaultProps));

    expect(screen.getByText(/notes/i)).toBeInTheDocument();
  });

  test('handles missing case data gracefully', () => {
    const Component = window.CaseDetailsView;

    const { container } = render(
      React.createElement(Component, {
        ...defaultProps,
        caseData: null,
      })
    );

    expect(container.firstChild).toBeNull();
  });

  test('handles case data with missing fields', () => {
    const Component = window.CaseDetailsView;

    render(
      React.createElement(Component, {
        ...defaultProps,
        caseData: { id: 'case-456' },
      })
    );

    // Should render without crashing even with minimal data
    expect(screen.getByText(/case-456/i)).toBeInTheDocument();
  });

  test('shows financial section when case has financial data', () => {
    const Component = window.CaseDetailsView;
    const caseWithFinancials = {
      ...mockCase,
      financialItems: [{ id: 'fin-1', description: 'Assessment', amount: 500 }],
    };

    render(
      React.createElement(Component, {
        ...defaultProps,
        caseData: caseWithFinancials,
      })
    );

    expect(screen.getByText(/financial/i)).toBeInTheDocument();
  });

  test('validates required fields before saving', async () => {
    const mockOnSave = jest.fn();
    const Component = window.CaseDetailsView;

    render(
      React.createElement(Component, {
        ...defaultProps,
        isEditing: true,
        onSave: mockOnSave,
        caseData: { ...mockCase, clientName: '' },
      })
    );

    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);

    // Should show validation error, not call onSave
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('matches snapshot in view mode', () => {
    const Component = window.CaseDetailsView;

    const { container } = render(React.createElement(Component, defaultProps));

    expect(container.firstChild).toMatchSnapshot();
  });

  test('matches snapshot in edit mode', () => {
    const Component = window.CaseDetailsView;

    const { container } = render(
      React.createElement(Component, {
        ...defaultProps,
        isEditing: true,
      })
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
