import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PersonCreationModal from '../../src/components/business/PersonCreationModal.jsx';
import { registerComponent } from '../../src/services/registry';
// NEW: import UI component modules so they self-register in the UI registry
import '../../src/components/ui/FormComponents.jsx';
import '../../src/components/ui/StepperModal.jsx';
import '../../src/components/ui/Modal.jsx';

// Reuse real UI form components – provide minimal Primary/Outline buttons if not already registered.
function registerBasicButtons() {
  const PrimaryButton = ({ children, onClick, disabled, loading }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="primary"
      data-loading={loading || undefined}
    >
      {children}
    </button>
  );
  const OutlineButton = ({ children, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="outline"
    >
      {children}
    </button>
  );
  registerComponent('ui', 'PrimaryButton', PrimaryButton);
  registerComponent('ui', 'OutlineButton', OutlineButton);
}

jest.mock('../../src/services/core.js', () => ({
  Validators: {
    phone: () => (val) => ({ isValid: true, sanitizedValue: val }),
    email: () => (val) => ({ isValid: true, sanitizedValue: val }),
  },
}));

jest.mock('../../src/services/nightingale.toast.js', () => ({
  __esModule: true,
  default: { showToast: jest.fn() },
}));

jest.mock('../../src/services/nightingale.dayjs.js', () => ({
  __esModule: true,
  default: { now: () => '2025-01-01T00:00:00.000Z' },
}));

const getToastMock = () =>
  require('../../src/services/nightingale.toast.js').default.showToast;

function setupFileService(initialData = null) {
  let currentData = initialData || { people: [], nextPersonId: 1 };
  return {
    checkPermission: jest.fn().mockResolvedValue('granted'),
    connect: jest.fn().mockResolvedValue(true),
    readFile: jest.fn().mockResolvedValue(currentData),
    writeFile: jest.fn().mockImplementation(async (data) => {
      currentData = data;
      return true;
    }),
    _getData: () => currentData,
  };
}

const baseFullData = {
  people: [],
  organizations: [],
  cases: [],
  nextPersonId: 1,
};

describe('PersonCreationModal (business)', () => {
  beforeEach(() => {
    registerBasicButtons();
    getToastMock().mockReset();
  });

  const openModal = (props = {}) => {
    return render(
      <PersonCreationModal
        isOpen
        onClose={props.onClose || jest.fn()}
        onPersonCreated={props.onPersonCreated || jest.fn()}
        fullData={props.fullData || baseFullData}
        fileService={
          props.fileService || setupFileService(props.fileServiceData)
        }
        editPersonId={props.editPersonId || null}
        requireFields={true}
      />,
    );
  };

  test('smoke: renders create modal first step', () => {
    openModal();
    expect(screen.getByText('Create New Person')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
  });

  test('validation: cannot advance without required fields', () => {
    openModal();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
    expect(getToastMock()).toHaveBeenCalledWith(
      'Please fix validation errors before continuing',
      'error',
    );
  });

  test('validation: invalid SSN format flagged then cleared', () => {
    openModal();
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Jane User' },
    });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
      target: { value: '1990-02-02' },
    });
    fireEvent.change(screen.getByLabelText(/Social Security Number/i), {
      target: { value: '123456789' },
    });
    fireEvent.click(screen.getByText('Next'));
    expect(
      screen.getByText('Invalid SSN format (use XXX-XX-XXXX)'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Social Security Number/i), {
      target: { value: '123-45-6789' },
    });
    fireEvent.click(screen.getByText('Next'));
    expect(
      screen.queryByText('Invalid SSN format (use XXX-XX-XXXX)'),
    ).not.toBeInTheDocument();
  });

  test('happy path: create new person', async () => {
    const onCreated = jest.fn();
    const onClose = jest.fn();
    const fileService = setupFileService({ people: [], nextPersonId: 3 });
    openModal({ onPersonCreated: onCreated, onClose, fileService });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Example' },
    });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
      target: { value: '1980-01-01' },
    });
    fireEvent.click(screen.getByText('Next'));

    fireEvent.change(screen.getByLabelText(/Street Address/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'Lincoln' },
    });
    fireEvent.change(screen.getByLabelText(/ZIP Code/i), {
      target: { value: '68501' },
    });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));

    fireEvent.click(screen.getByText('Create Person'));

    // Wait for fileService write and modal close side effects
    await import('@testing-library/react').then(({ waitFor }) =>
      waitFor(() => {
        expect(fileService.writeFile).toHaveBeenCalledTimes(1);
      }),
    );

    const writeFile = fileService.writeFile;
    const savedArg = writeFile.mock.calls[0][0];
    const newPerson = savedArg.people.find((p) => p.name === 'John Example');
    expect(newPerson).toBeTruthy();
    expect(newPerson.id).toBe('3');
    expect(savedArg.nextPersonId).toBe(4);
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John Example', id: '3' }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(getToastMock()).toHaveBeenCalledWith(
      'Person created successfully',
      'success',
    );
  });

  test('edit mode: updates existing person only', async () => {
    const existing = {
      id: '5',
      name: 'Alice Original',
      dateOfBirth: '1975-05-05',
      address: {
        street: '10 Old Rd',
        city: 'Omaha',
        state: 'NE',
        zip: '68102',
      },
      createdAt: '2024-12-12T00:00:00.000Z',
    };
    const fileService = setupFileService({
      people: [existing],
      nextPersonId: 6,
    });
    const onCreated = jest.fn();
    openModal({
      fileService,
      fullData: { ...baseFullData, people: [existing] },
      editPersonId: '5',
      onPersonCreated: onCreated,
    });

    expect(screen.getByText('Edit Person')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Contact Information'));
    const phoneLabel = screen.getByLabelText(/Phone Number/i);
    fireEvent.change(phoneLabel, { target: { value: '402-555-9999' } });

    const saveBtnEdit = screen.getByText(/Save Changes|No Changes/);
    expect(saveBtnEdit).toHaveTextContent('Save Changes');
    fireEvent.click(saveBtnEdit);

    await screen.findByText('Edit Person');

    expect(fileService.writeFile).toHaveBeenCalledTimes(1);
    const updatedDataEdit = fileService._getData();
    const updatedPerson = updatedDataEdit.people.find((p) => p.id === '5');
    expect(updatedPerson.phone).toBe('402-555-9999');
    expect(updatedPerson.createdAt).toBe('2024-12-12T00:00:00.000Z');
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: '5', phone: '402-555-9999' }),
    );
    expect(getToastMock()).toHaveBeenCalledWith(
      'Person updated successfully',
      'success',
    );
  });
});
