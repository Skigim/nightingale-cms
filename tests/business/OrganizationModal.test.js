import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OrganizationModal from '../../src/components/business/OrganizationModal.jsx';
import { registerComponent } from '../../src/services/registry';
// Ensure UI components self-register
import '../../src/components/ui/FormComponents.jsx';
import '../../src/components/ui/StepperModal.jsx';
import '../../src/components/ui/Modal.jsx';

// Provide minimal button variants used via registry (Primary, Outline, Secondary, Danger)
function ensureButtons() {
  const makeBtn =
    (aria) =>
    ({ children, onClick, disabled, loading, size }) => (
      <button
        onClick={onClick}
        disabled={disabled}
        data-size={size}
        data-loading={loading || undefined}
        aria-label={aria}
      >
        {children}
      </button>
    );
  registerComponent('ui', 'PrimaryButton', makeBtn('primary'));
  registerComponent('ui', 'OutlineButton', makeBtn('outline'));
  registerComponent('ui', 'SecondaryButton', makeBtn('secondary'));
  registerComponent('ui', 'DangerButton', makeBtn('danger'));
}

// Mock validators to always pass format checks
jest.mock('../../src/services/core.js', () => ({
  Validators: {
    phone: () => (val) => ({ isValid: true, sanitizedValue: val }),
    email: () => (val) => ({ isValid: true, sanitizedValue: val }),
  },
}));

// Toast mock
jest.mock('../../src/services/nightingale.toast.js', () => ({
  __esModule: true,
  default: { showToast: jest.fn() },
}));

// date util now stub
jest.mock('../../src/services/nightingale.dayjs.js', () => ({
  __esModule: true,
  default: { now: () => '2025-01-02T00:00:00.000Z' },
}));

const toastMock = () =>
  require('../../src/services/nightingale.toast.js').default.showToast;

function fileServiceFactory(initialData) {
  let current = initialData || { organizations: [], nextOrganizationId: 1 };
  return {
    readFile: jest.fn().mockResolvedValue(current),
    writeFile: jest.fn().mockImplementation(async (data) => {
      current = data;
      return true;
    }),
    _get: () => current,
  };
}

const baseFullData = {
  organizations: [],
  people: [],
  cases: [],
  nextOrganizationId: 1,
};

const renderModal = (props = {}) => {
  ensureButtons();
  return render(
    <OrganizationModal
      isOpen
      onClose={props.onClose || jest.fn()}
      onOrganizationCreated={props.onOrganizationCreated || jest.fn()}
      fullData={props.fullData || baseFullData}
      fileService={
        props.fileService || fileServiceFactory(props.initialFileData)
      }
      editOrganizationId={props.editOrganizationId || null}
    />,
  );
};

describe('OrganizationModal (business)', () => {
  beforeEach(() => {
    toastMock().mockReset();
  });

  test('smoke: renders first step in create mode', () => {
    renderModal();
    expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Type/i)).toBeInTheDocument();
  });

  test('validation: cannot advance with empty required fields', () => {
    renderModal();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(
      screen.getByText('Organization name is required'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Organization type is required'),
    ).toBeInTheDocument();
    expect(toastMock()).toHaveBeenCalledWith(
      'Please fix validation errors before continuing',
      'error',
    );
  });

  test('happy path: create organization minimal fields', async () => {
    const onCreated = jest.fn();
    const onClose = jest.fn();
    const fileService = fileServiceFactory({
      organizations: [],
      nextOrganizationId: 5,
    });
    renderModal({ onOrganizationCreated: onCreated, onClose, fileService });

    // Step 0
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Helping Hands' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Type/i), {
      target: { value: 'Non-Profit' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Step 1 - only city required
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'Lincoln' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Step 2 Personnel (leave default blank) -> Next
    fireEvent.click(screen.getByText('Next'));

    // Step 3 Review & Save
    fireEvent.click(screen.getByText('Create Organization'));

    // Wait for writeFile call
    await import('@testing-library/react').then(({ waitFor }) =>
      waitFor(() => {
        expect(fileService.writeFile).toHaveBeenCalledTimes(1);
      }),
    );

    const savedArg = fileService.writeFile.mock.calls[0][0];
    const org = savedArg.organizations.find((o) => o.name === 'Helping Hands');
    expect(org).toBeTruthy();
    expect(org.id).toBe('5');
    expect(savedArg.nextOrganizationId).toBe(6);
    // Personnel filtered (blank entry removed)
    expect(org.personnel.length).toBe(0);
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Helping Hands', id: '5' }),
    );
    expect(onClose).toHaveBeenCalled();
    expect(toastMock()).toHaveBeenCalledWith(
      'Organization created successfully',
      'success',
    );
  });

  test('edit mode: updates existing organization', async () => {
    const existing = {
      id: '7',
      name: 'Legacy Org',
      type: 'Agency',
      address: { street: '', city: 'Omaha', state: 'NE', zip: '' },
      personnel: [],
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const fileService = fileServiceFactory({
      organizations: [existing],
      nextOrganizationId: 8,
    });
    const onCreated = jest.fn();
    renderModal({
      fileService,
      fullData: { ...baseFullData, organizations: [existing] },
      editOrganizationId: '7',
      onOrganizationCreated: onCreated,
    });

    expect(screen.getByText('Edit Organization')).toBeInTheDocument();
    // Move to Contact Information step (index 1)
    fireEvent.click(screen.getByText('Contact Information'));
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'Lincoln' },
    });

    const saveBtn = screen.getByText(/Save Changes|No Changes/);
    expect(saveBtn).toHaveTextContent('Save Changes');
    fireEvent.click(saveBtn);

    await import('@testing-library/react').then(({ waitFor }) =>
      waitFor(() => {
        expect(fileService.writeFile).toHaveBeenCalledTimes(1);
      }),
    );

    const updated = fileService._get().organizations.find((o) => o.id === '7');
    expect(updated.address.city).toBe('Lincoln');
    expect(updated.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '7',
        address: expect.objectContaining({ city: 'Lincoln' }),
      }),
    );
    expect(toastMock()).toHaveBeenCalledWith(
      'Organization updated successfully',
      'success',
    );
  });

  test('error path: write failure shows error toast and no callback', async () => {
    const onCreated = jest.fn();
    const onClose = jest.fn();
    const fileService = fileServiceFactory({
      organizations: [],
      nextOrganizationId: 2,
    });
    fileService.writeFile.mockResolvedValue(false); // force failure path
    renderModal({ onOrganizationCreated: onCreated, onClose, fileService });

    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Failing Org' },
    });
    fireEvent.change(screen.getByLabelText(/Organization Type/i), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'Lincoln' },
    });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Create Organization'));

    await import('@testing-library/react').then(({ waitFor }) =>
      waitFor(() => {
        expect(fileService.writeFile).toHaveBeenCalledTimes(1);
      }),
    );

    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(toastMock()).toHaveBeenCalledWith(
      expect.stringContaining('Error saving organization:'),
      'error',
    );
  });
});
