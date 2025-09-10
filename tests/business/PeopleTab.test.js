/**
 * @jest-environment jsdom
 */

// PeopleTab tests updated for MUI-based implementation
import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

// Provide global React (project pattern relies on window.React)
window.React = React;

// Minimal registries
if (!window.NightingaleUI) {
  window.NightingaleUI = {
    components: {},
    registerComponent(n, c) {
      this.components[n] = c;
    },
  };
}
if (!window.NightingaleBusiness) {
  window.NightingaleBusiness = {
    components: {},
    registerComponent(n, c) {
      this.components[n] = c;
    },
  };
}

// Import factory (TabBase defines createBusinessComponent & fallbacks)
import '../../src/components/ui/TabBase.jsx';

// Stub ONLY the PersonCreationModal for predictable modal content text
function PersonCreationModalStub({ isOpen }) {
  if (!isOpen) return null;
  const e = window.React.createElement;
  return e(
    'div',
    { role: 'dialog', 'aria-modal': 'true' },
    e('h2', null, 'Create New Person'),
  );
}
window.NightingaleBusiness.registerComponent(
  'PersonCreationModal',
  PersonCreationModalStub,
);

// Minimal Card stub so SearchSection (which tries to resolve Card) doesn't emit error wrapper
function CardStub({ children }) {
  const e = window.React.createElement;
  return e('div', null, children);
}
window.NightingaleUI.registerComponent('Card', CardStub);

// Import PeopleTab after stubbing modal
import PeopleTab from '../../src/components/business/PeopleTab.jsx';

const PEOPLE = [
  { id: 'p1', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'p2', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'p3', name: 'Charlie Brown', email: 'charlie@sample.org' },
];

const baseProps = {
  fullData: { people: PEOPLE, cases: [] },
  onUpdateData: jest.fn(),
};

afterEach(() => cleanup());

describe('PeopleTab (MUI version)', () => {
  test('renders header count and all people names', () => {
    render(<PeopleTab {...baseProps} />);
    // Heading
    expect(screen.getByRole('heading', { name: 'People' })).toBeInTheDocument();
    // Count subtitle
    expect(screen.getByText(/3 people/)).toBeInTheDocument();
    // Names in table
    ['Alice Johnson', 'Bob Smith', 'Charlie Brown'].forEach((n) => {
      expect(screen.getByText(n)).toBeInTheDocument();
    });
  });

  test('filters via search updates list and count', () => {
    render(<PeopleTab {...baseProps} />);
    const input = screen.getByPlaceholderText(
      'Search people by name, email, phone, address...',
    );
    fireEvent.change(input, { target: { value: 'alice' } });
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).toBeNull();
    expect(screen.queryByText('Charlie Brown')).toBeNull();
    expect(screen.getByText(/1 person$/)).toBeInTheDocument();
  });

  test('opens creation modal when Add Person (aria-label New Person) clicked', () => {
    render(<PeopleTab {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /New Person/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create New Person')).toBeInTheDocument();
  });

  test('shows empty state message for zero people', () => {
    render(
      <PeopleTab
        {...baseProps}
        fullData={{ people: [], cases: [] }}
      />,
    );
    // Header count still shows 0 people
    expect(screen.getByText(/0 people$/)).toBeInTheDocument();
    // Empty state card text
    expect(screen.getByText('No people found')).toBeInTheDocument();
  });

  test('navigates to details view on row click', () => {
    render(<PeopleTab {...baseProps} />);
    const firstCell = screen.getByText('Alice Johnson');
    const row = firstCell.closest('tr');
    fireEvent.click(row);
    // Back to List button from real PersonDetailsView
    expect(
      screen.getByRole('button', { name: /Back to List/i }),
    ).toBeInTheDocument();
    // Original table row (Bob) should no longer be visible
    expect(screen.queryByText('Bob Smith')).toBeNull();
  });

  test('returns to list from details view', () => {
    render(<PeopleTab {...baseProps} />);
    // Enter details view
    fireEvent.click(screen.getByText('Alice Johnson').closest('tr'));
    expect(
      screen.getByRole('button', { name: /Back to List/i }),
    ).toBeInTheDocument();
    // Go back
    fireEvent.click(screen.getByRole('button', { name: /Back to List/i }));
    // Table restored (Bob visible again)
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    // Count visible
    expect(screen.getByText(/3 people/)).toBeInTheDocument();
  });
});
