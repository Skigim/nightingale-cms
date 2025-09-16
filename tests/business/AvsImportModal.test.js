import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvsImportModal from '../../src/components/business/AvsImportModal.jsx';
import { registerComponent } from '../../src/services/registry';
import { parseAvsData } from '../../src/services/nightingale.parsers.js';

jest.mock('../../src/services/nightingale.parsers.js', () => ({
  parseAvsData: jest.fn(),
}));

// Minimal modal + form field + textarea + button UI test doubles
function DummyModal({ isOpen, children, title, onClose }) {
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
    >
      <h3>{title}</h3>
      <button onClick={onClose}>Close</button>
      {children}
    </div>
  );
}
function DummyFormField({ label, children, error }) {
  return (
    <label>
      {label}
      {error && <span data-testid="error">{error}</span>}
      {children}
    </label>
  );
}
function DummyTextarea(props) {
  return (
    <textarea
      aria-label="avs-data"
      {...props}
    />
  );
}
function DummyButton({ children, ...rest }) {
  return <button {...rest}>{children}</button>;
}

// Register dummy UI components used via registry lookups
registerComponent('ui', 'Modal', DummyModal);
registerComponent('ui', 'FormField', DummyFormField);
registerComponent('ui', 'Textarea', DummyTextarea);
registerComponent('ui', 'Button', DummyButton);

describe('AvsImportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses data successfully and imports selected items', async () => {
    parseAvsData.mockReturnValue([
      {
        type: 'Checking Account',
        location: 'First National Bank',
        owner: 'John Doe',
        accountNumber: '1234',
        value: 1500,
      },
    ]);

    const handleImport = jest.fn();
    const handleClose = jest.fn();

    render(
      <AvsImportModal
        isOpen
        onClose={handleClose}
        onImport={handleImport}
        masterCaseId="CASE-1"
        existingResources={[]}
      />,
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Some AVS Raw Data' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Parse & Compare Data/i }),
    );

    // Preview appears
    await waitFor(() =>
      expect(screen.getByText(/Import Preview/i)).toBeInTheDocument(),
    );

    // Import button should reflect 1 selected item
    const importBtn = screen.getByRole('button', {
      name: /Import 1 Selected Item/i,
    });
    fireEvent.click(importBtn);

    expect(handleImport).toHaveBeenCalledTimes(1);
    const imported = handleImport.mock.calls[0][0];
    expect(imported).toHaveLength(1);
    expect(handleClose).toHaveBeenCalled();
  });

  it('shows parse error when parser returns no accounts', async () => {
    parseAvsData.mockReturnValue([]); // triggers no valid account error

    render(
      <AvsImportModal
        isOpen
        onClose={() => {}}
        onImport={() => {}}
        masterCaseId="CASE-2"
        existingResources={[]}
      />,
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, {
      target: { value: 'Raw but unparsable content' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Parse & Compare Data/i }),
    );

    await waitFor(() => {
      const matches = screen.getAllByText(/No valid account data found/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});
