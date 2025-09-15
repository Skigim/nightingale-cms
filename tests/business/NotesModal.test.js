import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotesModal from '../../src/components/business/NotesModal.jsx';
import { registerComponent } from '../../src/services/registry';
import Toast from '../../src/services/nightingale.toast.js';

// Minimal UI component stubs needed by NotesModal (enhanced SearchBar for Batch6)
function StubModal({ isOpen, title, children, footerContent, onClose }) {
  if (!isOpen) return null;
  return (
    <div data-testid="modal-root">
      <h2>{title}</h2>
      <div>{children}</div>
      <div data-testid="modal-footer">{footerContent}</div>
      <button onClick={onClose}>X</button>
    </div>
  );
}
function StubButton({ children, onClick, disabled, variant }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  );
}
function StubFormField({ label, children, error }) {
  return (
    <label>
      <span>{label}</span>
      {children}
      {error && <div role="alert">{error}</div>}
    </label>
  );
}
function StubSearchBar({ value, onChange, placeholder, onResultSelect, data }) {
  return (
    <div>
      <input
        aria-label="Category"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e)}
      />
      {/* Helper button to trigger onResultSelect with first data item for branch coverage */}
      {onResultSelect && data?.length > 0 && (
        <button
          type="button"
          onClick={() => onResultSelect(data[0])}
        >
          Select First Category
        </button>
      )}
    </div>
  );
}
function StubTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      aria-label="Note Text"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
    />
  );
}
function StubBadge({ status }) {
  return <span>{status}</span>;
}

// Register stubs in the registry prior to tests
beforeAll(() => {
  registerComponent('ui', 'Modal', StubModal);
  registerComponent('ui', 'Button', StubButton);
  registerComponent('ui', 'FormField', StubFormField);
  registerComponent('ui', 'SearchBar', StubSearchBar);
  registerComponent('ui', 'Textarea', StubTextarea);
  registerComponent('ui', 'Badge', StubBadge);
});

describe('NotesModal Batch1 - smoke, empty states, open/close/reset', () => {
  test('does not render when closed', () => {
    render(
      <NotesModal
        isOpen={false}
        onClose={jest.fn()}
        notes={[]}
        caseId="c1"
        caseData={{}}
        fullData={{ people: [] }}
      />,
    );
    expect(screen.queryByTestId('modal-root')).not.toBeInTheDocument();
  });

  test('renders empty state when open with no notes', () => {
    render(
      <NotesModal
        isOpen={true}
        onClose={jest.fn()}
        notes={[]}
        caseId="c1"
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );
    expect(screen.getByText(/Existing Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/No notes found/i)).toBeInTheDocument();
    // Footer buttons: Cancel + Add New Note
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add New Note' }),
    ).toBeInTheDocument();
  });

  test('close via Cancel in view mode triggers onClose', () => {
    const onClose = jest.fn();
    render(
      <NotesModal
        isOpen={true}
        onClose={onClose}
        notes={[]}
        caseId="c1"
        caseData={{}}
        fullData={{ people: [] }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('switch to edit mode then Cancel resets to view mode without closing', () => {
    const onClose = jest.fn();
    render(
      <NotesModal
        isOpen={true}
        onClose={onClose}
        notes={[]}
        caseId="c1"
        caseData={{}}
        fullData={{ people: [] }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add New Note' }));
    // Now should show form labels
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Note Text')).toBeInTheDocument();
    // Cancel should return to view mode (Existing Notes heading present again)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/Existing Notes/)).toBeInTheDocument();
    // Add New Note button visible again
    expect(
      screen.getByRole('button', { name: 'Add New Note' }),
    ).toBeInTheDocument();
  });
});

describe('NotesModal Batch2 - create validation and success', () => {
  function setup(onNotesUpdate = jest.fn()) {
    const onClose = jest.fn();
    const utils = render(
      <NotesModal
        isOpen={true}
        onClose={onClose}
        notes={[]}
        caseId="c1"
        onNotesUpdate={onNotesUpdate}
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );
    return { onClose, onNotesUpdate, ...utils };
  }

  test('shows validation errors for empty fields then clears after fill and add', () => {
    const { onNotesUpdate } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Add New Note' }));
    fireEvent.click(screen.getByRole('button', { name: /Add Note/i }));

    // Validation errors appear (find by text inside alert containers)
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Note text is required')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Note Text'), {
      target: { value: 'Hi' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Note/i }));
    expect(
      screen.getByText('Note text must be at least 3 characters'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'General' },
    });
    fireEvent.change(screen.getByLabelText('Note Text'), {
      target: { value: 'A new valid note' },
    });

    const toastSpy = jest
      .spyOn(Toast, 'showToast')
      .mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: /Add Note/i }));

    expect(screen.getByText(/Existing Notes/)).toBeInTheDocument();
    expect(screen.getByText(/Existing Notes \(1\)/)).toBeInTheDocument();
    expect(onNotesUpdate).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenCalledWith('Note added successfully', 'success');

    toastSpy.mockRestore();
  });
});

describe('NotesModal Batch3 - edit flow and cancel', () => {
  const baseNotes = [
    {
      id: 'n1',
      category: 'General',
      text: 'Original general note',
      timestamp: '2024-02-01T10:00:00.000Z', // newer
    },
    {
      id: 'n2',
      category: 'Medical',
      text: 'Older medical note',
      timestamp: '2024-01-15T09:00:00.000Z', // older
    },
  ];

  function setup(customNotes = baseNotes, onNotesUpdate = jest.fn()) {
    const onClose = jest.fn();
    const utils = render(
      <NotesModal
        isOpen={true}
        onClose={onClose}
        notes={customNotes}
        caseId="c1"
        onNotesUpdate={onNotesUpdate}
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );
    return { onClose, onNotesUpdate, ...utils };
  }

  test('renders existing notes sorted by timestamp desc and edits first note successfully', () => {
    const { onNotesUpdate } = setup();

    // Heading reflects two notes
    expect(screen.getByText(/Existing Notes \(2\)/)).toBeInTheDocument();
    // Both note texts present
    expect(screen.getByText('Original general note')).toBeInTheDocument();
    expect(screen.getByText('Older medical note')).toBeInTheDocument();

    // Click first Edit button (should correspond to newer note due to sort)
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    fireEvent.click(editButtons[0]);

    // Form prefilled
    const categoryInput = screen.getByLabelText('Category');
    const textArea = screen.getByLabelText('Note Text');
    expect(categoryInput.value).toBe('General');
    expect(textArea.value).toBe('Original general note');

    // Modify text
    fireEvent.change(textArea, {
      target: { value: 'Updated general note content' },
    });

    // Spy toast
    const toastSpy = jest
      .spyOn(Toast, 'showToast')
      .mockImplementation(() => {});

    // Save Changes
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    // Back to list view with updated text
    expect(screen.getByText(/Existing Notes \(2\)/)).toBeInTheDocument();
    expect(
      screen.getByText('Updated general note content'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Original general note')).not.toBeInTheDocument();
    // Older note still present
    expect(screen.getByText('Older medical note')).toBeInTheDocument();

    // onNotesUpdate called for edit (should be once)
    expect(onNotesUpdate).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenCalledWith(
      'Note updated successfully',
      'success',
    );

    toastSpy.mockRestore();
  });

  test('cancel from edit mode does not persist changes or close modal', () => {
    const { onClose, onNotesUpdate } = setup();

    // Enter edit mode for second note (after sorting, second Edit button corresponds to older note)
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    fireEvent.click(editButtons[1]);

    const textArea = screen.getByLabelText('Note Text');
    expect(textArea.value).toBe('Older medical note');

    fireEvent.change(textArea, {
      target: { value: 'Attempted change that should be discarded' },
    });

    // Cancel (returns to view mode, not closing)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Modal still open (heading present) and original text unchanged
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Older medical note')).toBeInTheDocument();
    expect(
      screen.queryByText('Attempted change that should be discarded'),
    ).not.toBeInTheDocument();

    // No update callback invoked
    expect(onNotesUpdate).not.toHaveBeenCalled();
  });
});

describe('NotesModal Batch4 - delete confirm/cancel + success', () => {
  const notes = [
    {
      id: 'd1',
      category: 'General',
      text: 'First note',
      timestamp: '2024-05-01T10:00:00.000Z',
    },
    {
      id: 'd2',
      category: 'Medical',
      text: 'Second note',
      timestamp: '2024-05-02T10:00:00.000Z',
    },
  ];
  function setup(onNotesUpdate = jest.fn()) {
    const onClose = jest.fn();
    const utils = render(
      <NotesModal
        isOpen={true}
        onClose={onClose}
        notes={notes}
        caseId="cDel"
        onNotesUpdate={onNotesUpdate}
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );
    return { onClose, onNotesUpdate, ...utils };
  }

  test('delete flow: open confirm then cancel leaves notes intact', () => {
    setup();
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

    // Two Cancel buttons now; pick the one in the confirmation modal (last occurrence)
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    // Confirmation modal gone
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();

    // Both notes remain
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  test('delete flow: confirm deletion removes note and shows toast', () => {
    const { onNotesUpdate } = setup();
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    // Spy toast
    const toastSpy = jest
      .spyOn(Toast, 'showToast')
      .mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: 'Delete Note' }));

    // One note removed
    // After deleting first (which was most recent), remaining note text still present
    expect(screen.getByText(/Existing Notes \(1\)/)).toBeInTheDocument();
    expect(onNotesUpdate).toHaveBeenCalledTimes(1);
    expect(toastSpy).toHaveBeenCalledWith(
      'Note deleted successfully',
      'success',
    );

    toastSpy.mockRestore();
  });
});

describe('NotesModal Batch5 - error handling & timestamp fallback', () => {
  beforeEach(() => {
    // Fresh logger mocks per test
    const logMap = {};
    global.NightingaleLogger = {
      get: (channel) => {
        if (!logMap[channel]) {
          logMap[channel] = {
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            debug: jest.fn(),
          };
        }
        return logMap[channel];
      },
      _logMap: logMap,
    };
  });

  test('save (add new) failure shows error toast, logs error, stays in edit mode and resets isSubmitting', () => {
    const failingUpdate = jest.fn(() => {
      throw new Error('save failed');
    });
    const onClose = jest.fn();

    render(
      <NotesModal
        isOpen={true}
        onClose={onClose}
        notes={[]}
        caseId="cErr1"
        onNotesUpdate={failingUpdate}
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add New Note' }));

    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'General' },
    });
    fireEvent.change(screen.getByLabelText('Note Text'), {
      target: { value: 'Some failing note content' },
    });

    const toastSpy = jest
      .spyOn(Toast, 'showToast')
      .mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: 'Add Note' }));

    expect(failingUpdate).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      'Error saving note. Please try again.',
      'error',
    );

    // Still in edit mode (form heading) and button label back to Add Note (not Saving...)
    expect(screen.getByText('Add New Note')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Note' })).not.toBeDisabled();

    // Logger invoked
    const saveLogger = global.NightingaleLogger.get('notes:save');
    expect(saveLogger.error).toHaveBeenCalled();

    toastSpy.mockRestore();
  });

  test('delete failure shows error toast, logs error, closes confirmation and does not show success toast', () => {
    const failingUpdate = jest.fn(() => {
      throw new Error('delete failed');
    });
    const logMap = {};
    global.NightingaleLogger = {
      get: (c) =>
        (logMap[c] = logMap[c] || {
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
          debug: jest.fn(),
        }),
      _logMap: logMap,
    };

    render(
      <NotesModal
        isOpen={true}
        onClose={jest.fn()}
        notes={[
          {
            id: 'dn1',
            category: 'General',
            text: 'To delete',
            timestamp: '2024-06-01T10:00:00.000Z',
          },
        ]}
        caseId="cErr2"
        onNotesUpdate={failingUpdate}
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

    const toastSpy = jest
      .spyOn(Toast, 'showToast')
      .mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: 'Delete Note' }));

    expect(failingUpdate).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      'Error deleting note. Please try again.',
      'error',
    );
    // Success message should not appear
    expect(toastSpy).not.toHaveBeenCalledWith(
      'Note deleted successfully',
      'success',
    );

    // Confirmation modal closed
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();

    // Note was already removed before error thrown (current behavior), list empty message visible
    expect(screen.getByText(/No notes found/)).toBeInTheDocument();

    const delLogger = global.NightingaleLogger.get('notes:delete');
    expect(delLogger.error).toHaveBeenCalled();

    toastSpy.mockRestore();
  });

  test('invalid timestamp uses Date fallback rendering', () => {
    render(
      <NotesModal
        isOpen={true}
        onClose={jest.fn()}
        notes={[
          {
            id: 'bad1',
            category: 'General',
            text: 'Bad time note',
            timestamp: 'not-a-date',
          },
        ]}
        caseId="cErr3"
        onNotesUpdate={jest.fn()}
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );

    // Should display fallback string (likely 'Invalid Date') somewhere near note list header row
    // We just assert the note text is present and at least one 'Invalid Date' occurrence exists.
    expect(screen.getByText('Bad time note')).toBeInTheDocument();
    expect(screen.getAllByText(/Invalid Date/).length).toBeGreaterThan(0);
  });
});

// Batch6 - category selection via onResultSelect & final branch coverage

describe('NotesModal Batch6 - category selection via onResultSelect', () => {
  test('select first category using helper button triggers handleCategorySelect path', () => {
    render(
      <NotesModal
        isOpen={true}
        onClose={jest.fn()}
        notes={[]}
        caseId="c6"
        onNotesUpdate={jest.fn()}
        caseData={{ personId: 'p1', mcn: 'MCN1' }}
        fullData={{ people: [{ id: 'p1', name: 'Alice' }] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add New Note' }));

    // Trigger selection of first category from provided data array
    fireEvent.click(
      screen.getByRole('button', { name: 'Select First Category' }),
    );

    // Category input now populated with first note category name 'Application Status'
    expect(screen.getByLabelText('Category').value).toBe('Application Status');
  });
});
