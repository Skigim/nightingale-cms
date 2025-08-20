/* eslint-disable react/prop-types */
/**
 * Nightingale Component Library - PersonCreationModal
 * Layer: Business (Domain-Specific)
 *
 * Modal for creating and editing person entries in the Nightingale CMS.
 * Utilizes StepperModal for multi-step workflow with proper validation.
 */
function PersonCreationModal({
  isOpen = false,
  onClose = () => {},
  onPersonCreated = () => {},
  editPersonId = null, // If provided, component will edit existing person
  fullData = null,
  fileService = null, // File service instance for data operations
}) {
  const e = window.React?.createElement;
  const { useState, useEffect, useMemo, useCallback } = window.React;

  // Initial person data structure
  const getInitialPersonData = () => {
    return {
      name: '',
      dateOfBirth: '',
      ssn: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: 'NE', // Default to Nebraska
        zip: '',
      },
      mailingAddress: {
        street: '',
        city: '',
        state: 'NE',
        zip: '',
        sameAsPhysical: true,
      },
      organizationId: null,
      livingArrangement: 'Apartment/House',
      authorizedRepIds: [],
      familyMembers: [],
    };
  };

  // Component state
  const [currentStep, setCurrentStep] = useState(0);
  const [personData, setPersonData] = useState(getInitialPersonData());
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Load existing person data for editing
  useEffect(() => {
    if (editPersonId && fullData && fullData.people) {
      const existingPerson = fullData.people.find((p) => p.id === editPersonId);
      if (existingPerson) {
        setPersonData({
          ...getInitialPersonData(),
          ...existingPerson,
          mailingAddress: {
            ...existingPerson.mailingAddress,
            sameAsPhysical:
              !existingPerson.mailingAddress ||
              JSON.stringify(existingPerson.address) ===
                JSON.stringify(existingPerson.mailingAddress),
          },
        });
      }
    } else {
      setPersonData(getInitialPersonData());
    }
  }, [editPersonId, fullData, isOpen]);

  // Step configuration
  const steps = useMemo(
    () => [
      {
        title: 'Basic Information',
        description: 'Name, date of birth, and identification',
      },
      {
        title: 'Contact Information',
        description: 'Phone, email, and address details',
      },
      {
        title: 'Additional Details',
        description: 'Living arrangement and organization',
      },
      {
        title: 'Review & Save',
        description: 'Confirm information and create person',
      },
    ],
    []
  );

  // Validation functions using Nightingale services
  const validateStep = useCallback(
    (stepIndex) => {
      const validators = window.Validators || {};
      const errors = {};

      switch (stepIndex) {
        case 0: // Basic Information
          if (!personData.name?.trim()) {
            errors.name = 'Name is required';
          }
          if (!personData.dateOfBirth) {
            errors.dateOfBirth = 'Date of birth is required';
          }
          if (personData.ssn) {
            // Simple SSN format validation (XXX-XX-XXXX)
            const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
            if (!ssnPattern.test(personData.ssn)) {
              errors.ssn = 'Invalid SSN format (use XXX-XX-XXXX)';
            }
          }
          break;

        case 1: // Contact Information
          if (personData.phone) {
            const phoneValidator = validators.phone?.();
            if (phoneValidator && !phoneValidator(personData.phone).isValid) {
              errors.phone = 'Invalid phone number format';
            }
          }
          if (personData.email) {
            const emailValidator = validators.email?.();
            if (emailValidator && !emailValidator(personData.email).isValid) {
              errors.email = 'Invalid email format';
            }
          }
          if (!personData.address.street?.trim()) {
            errors.address = 'Street address is required';
          }
          if (!personData.address.city?.trim()) {
            errors.city = 'City is required';
          }
          if (!personData.address.zip?.trim()) {
            errors.zip = 'ZIP code is required';
          }
          break;

        case 2: // Additional Details
          // Optional validations for living arrangement, organization
          break;

        case 3: {
          // Review & Save
          // Final validation - check all previous steps
          const allStepErrors = [0, 1, 2].reduce((acc, step) => {
            return { ...acc, ...validateStep(step) };
          }, {});
          Object.assign(errors, allStepErrors);
          break;
        }
      }

      return errors;
    },
    [personData]
  );

  // Handle step change with validation
  const handleStepChange = useCallback(
    (newStep) => {
      if (newStep > currentStep) {
        // Validate current step before advancing
        const stepErrors = validateStep(currentStep);
        if (Object.keys(stepErrors).length > 0) {
          setValidationErrors(stepErrors);
          window.showToast?.(
            'Please fix validation errors before continuing',
            'error'
          );
          return;
        }
      }

      setValidationErrors({});
      setCurrentStep(newStep);
    },
    [currentStep, validateStep]
  );

  // Handle form data updates
  const updatePersonData = useCallback(
    (field, value) => {
      setPersonData((prev) => {
        const newData = { ...prev };

        // Handle nested objects (address, mailingAddress)
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          newData[parent] = { ...prev[parent], [child]: value };
        } else {
          newData[field] = value;
        }

        // Auto-sync mailing address if checkbox is checked
        if (
          field.startsWith('address.') &&
          newData.mailingAddress?.sameAsPhysical
        ) {
          const addressField = field.split('.')[1];
          newData.mailingAddress[addressField] = value;
        }

        return newData;
      });

      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  // Handle mailing address sync
  const handleMailingAddressSync = useCallback((e) => {
    const checked = e.target.checked;
    setPersonData((prev) => ({
      ...prev,
      mailingAddress: {
        ...prev.mailingAddress,
        sameAsPhysical: checked,
        ...(checked ? prev.address : {}),
      },
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const finalErrors = validateStep(3);
    if (Object.keys(finalErrors).length > 0) {
      setValidationErrors(finalErrors);
      window.showToast?.('Please fix all validation errors', 'error');
      return;
    }

    setIsLoading(true);

    try {
      if (!fileService) {
        throw new Error('File service not available');
      }

      const currentData = await fileService.readFile();
      const dateUtils = window.dateUtils || {};

      // Initialize default data structure if file doesn't exist or is empty
      const defaultData = {
        cases: [],
        people: [],
        organizations: [],
        nextPersonId: 1,
        nextCaseId: 1,
        nextOrganizationId: 1,
        nextFinancialItemId: 1,
        nextNoteId: 1,
        showAllCases: false,
        showAllContacts: false,
        showAllPeople: true,
        caseSortReversed: false,
        priorityFilterActive: false,
        contacts: [],
        vrTemplates: [],
        nextVrTemplateId: 1,
        vrCategories: [],
        vrRequests: [],
        nextVrRequestId: 1,
        vrDraftItems: [],
        activeCase: null,
        isDataLoaded: true,
        showAllOrganizations: false,
      };

      // Merge current data with defaults to ensure all required fields exist
      const safeCurrentData = {
        ...defaultData,
        ...currentData,
        people: currentData?.people || [],
        nextPersonId: currentData?.nextPersonId || 1,
      };

      let updatedData;
      let successMessage;

      if (editPersonId) {
        // Update existing person
        updatedData = {
          ...safeCurrentData,
          people: safeCurrentData.people.map((person) =>
            person.id === editPersonId
              ? {
                  ...person,
                  ...personData,
                  // Don't change the original creation date
                  createdAt: person.createdAt,
                }
              : person
          ),
        };
        successMessage = 'Person updated successfully';
      } else {
        // Create new person
        const nextPersonId = String(safeCurrentData.nextPersonId || 1);
        const newPerson = {
          ...personData,
          id: nextPersonId,
          createdAt: dateUtils.now?.() || new Date().toISOString(),
        };

        updatedData = {
          ...safeCurrentData,
          people: [...safeCurrentData.people, newPerson],
          nextPersonId: parseInt(nextPersonId) + 1,
        };
        successMessage = 'Person created successfully';
      }

      console.log('Saving updated data:', updatedData); // Debug log
      const saveResult = await fileService.writeFile(updatedData);

      if (!saveResult) {
        throw new Error('Failed to save data - writeFile returned false');
      }

      window.showToast?.(successMessage, 'success');

      // Call callback with the created/updated person
      const resultPerson = editPersonId
        ? updatedData.people.find((p) => p.id === editPersonId)
        : updatedData.people[updatedData.people.length - 1];

      onPersonCreated(resultPerson);
      onClose();
    } catch (error) {
      console.error('Error saving person:', error);
      window.showToast?.('Error saving person: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    personData,
    editPersonId,
    onPersonCreated,
    onClose,
    validateStep,
    fileService,
  ]);

  // Render step content
  const renderStepContent = useCallback(() => {
    const FormField = window.FormField;
    const TextInput = window.TextInput;
    const DateInput = window.DateInput;
    const Select = window.Select;
    const Checkbox = window.Checkbox;

    if (!FormField || !TextInput) {
      return e(
        'div',
        { className: 'p-4 text-red-600' },
        'Form components not loaded. Please ensure FormComponents.js is loaded.'
      );
    }

    switch (currentStep) {
      case 0: // Basic Information
        return e(
          'div',
          { className: 'space-y-4' },
          e(
            FormField,
            {
              label: 'Full Name',
              required: true,
              error: validationErrors.name,
            },
            e(TextInput, {
              value: personData.name,
              onChange: (e) => updatePersonData('name', e.target.value),
              placeholder: 'Enter full name',
              required: true,
            })
          ),
          e(
            FormField,
            {
              label: 'Date of Birth',
              required: true,
              error: validationErrors.dateOfBirth,
            },
            e(DateInput, {
              value: personData.dateOfBirth,
              onChange: (e) => updatePersonData('dateOfBirth', e.target.value),
              required: true,
            })
          ),
          e(
            FormField,
            {
              label: 'Social Security Number',
              hint: 'Format: XXX-XX-XXXX (optional)',
              error: validationErrors.ssn,
            },
            e(TextInput, {
              value: personData.ssn,
              onChange: (e) => updatePersonData('ssn', e.target.value),
              placeholder: '***-**-****',
              maxLength: 11,
            })
          )
        );

      case 1: // Contact Information
        return e(
          'div',
          { className: 'space-y-4' },
          e(
            FormField,
            {
              label: 'Phone Number',
              error: validationErrors.phone,
            },
            e(TextInput, {
              value: personData.phone,
              onChange: (e) => updatePersonData('phone', e.target.value),
              placeholder: '(402) 555-0123',
              type: 'tel',
            })
          ),
          e(
            FormField,
            {
              label: 'Email Address',
              error: validationErrors.email,
            },
            e(TextInput, {
              value: personData.email,
              onChange: (e) => updatePersonData('email', e.target.value),
              placeholder: 'person@example.com',
              type: 'email',
            })
          ),
          e(
            'h4',
            { className: 'font-medium text-gray-300 mt-6 mb-3' },
            'Physical Address'
          ),
          e(
            FormField,
            {
              label: 'Street Address',
              required: true,
              error: validationErrors.address,
            },
            e(TextInput, {
              value: personData.address.street,
              onChange: (e) =>
                updatePersonData('address.street', e.target.value),
              placeholder: '123 Main Street',
              required: true,
            })
          ),
          e(
            'div',
            { className: 'grid grid-cols-2 gap-4' },
            e(
              FormField,
              {
                label: 'City',
                required: true,
                error: validationErrors.city,
              },
              e(TextInput, {
                value: personData.address.city,
                onChange: (e) =>
                  updatePersonData('address.city', e.target.value),
                placeholder: 'Lincoln',
                required: true,
              })
            ),
            e(
              FormField,
              {
                label: 'State',
                required: true,
              },
              e(Select, {
                value: personData.address.state,
                onChange: (e) =>
                  updatePersonData('address.state', e.target.value),
                options: [
                  { value: 'NE', label: 'Nebraska' },
                  { value: 'IA', label: 'Iowa' },
                  { value: 'KS', label: 'Kansas' },
                  { value: 'MO', label: 'Missouri' },
                  { value: 'CO', label: 'Colorado' },
                  { value: 'WY', label: 'Wyoming' },
                ],
                required: true,
              })
            )
          ),
          e(
            FormField,
            {
              label: 'ZIP Code',
              required: true,
              error: validationErrors.zip,
            },
            e(TextInput, {
              value: personData.address.zip,
              onChange: (e) => updatePersonData('address.zip', e.target.value),
              placeholder: '68501',
              maxLength: 10,
              required: true,
            })
          ),
          e(
            'h4',
            { className: 'font-medium text-gray-300 mt-6 mb-3' },
            'Mailing Address'
          ),
          e(Checkbox, {
            checked: personData.mailingAddress.sameAsPhysical,
            onChange: handleMailingAddressSync,
            label: 'Same as physical address',
          }),
          !personData.mailingAddress.sameAsPhysical &&
            e(
              'div',
              { className: 'space-y-4 mt-4' },
              e(
                FormField,
                { label: 'Mailing Street Address' },
                e(TextInput, {
                  value: personData.mailingAddress.street,
                  onChange: (e) =>
                    updatePersonData('mailingAddress.street', e.target.value),
                  placeholder: '123 Main Street',
                })
              ),
              e(
                'div',
                { className: 'grid grid-cols-2 gap-4' },
                e(
                  FormField,
                  { label: 'Mailing City' },
                  e(TextInput, {
                    value: personData.mailingAddress.city,
                    onChange: (e) =>
                      updatePersonData('mailingAddress.city', e.target.value),
                    placeholder: 'Lincoln',
                  })
                ),
                e(
                  FormField,
                  { label: 'Mailing State' },
                  e(Select, {
                    value: personData.mailingAddress.state,
                    onChange: (e) =>
                      updatePersonData('mailingAddress.state', e.target.value),
                    options: [
                      { value: 'NE', label: 'Nebraska' },
                      { value: 'IA', label: 'Iowa' },
                      { value: 'KS', label: 'Kansas' },
                      { value: 'MO', label: 'Missouri' },
                      { value: 'CO', label: 'Colorado' },
                      { value: 'WY', label: 'Wyoming' },
                    ],
                  })
                )
              ),
              e(
                FormField,
                { label: 'Mailing ZIP Code' },
                e(TextInput, {
                  value: personData.mailingAddress.zip,
                  onChange: (e) =>
                    updatePersonData('mailingAddress.zip', e.target.value),
                  placeholder: '68501',
                  maxLength: 10,
                })
              )
            )
        );

      case 2: {
        // Additional Details
        const livingArrangementOptions = [
          { value: 'Apartment/House', label: 'Apartment/House' },
          { value: 'Assisted Living', label: 'Assisted Living' },
          { value: 'Nursing Home', label: 'Nursing Home' },
          { value: 'Other', label: 'Other' },
        ];

        const organizationOptions = fullData?.organizations
          ? [
              { value: null, label: 'No organization' },
              ...fullData.organizations.map((org) => ({
                value: org.id,
                label: org.name,
              })),
            ]
          : [{ value: null, label: 'No organization' }];

        return e(
          'div',
          { className: 'space-y-4' },
          e(
            FormField,
            {
              label: 'Living Arrangement',
              hint: 'Current living situation',
            },
            e(Select, {
              value: personData.livingArrangement,
              onChange: (e) =>
                updatePersonData('livingArrangement', e.target.value),
              options: livingArrangementOptions,
            })
          ),
          e(
            FormField,
            {
              label: 'Associated Organization',
              hint: 'Select if person is associated with a care facility or organization',
            },
            e(Select, {
              value: personData.organizationId,
              onChange: (e) =>
                updatePersonData('organizationId', e.target.value),
              options: organizationOptions,
            })
          )
        );
      }

      case 3: {
        // Review & Save
        // Safety check for personData
        if (!personData) {
          return e(
            'div',
            { className: 'p-4 text-red-600' },
            'Error: Person data not available. Please go back and fill out the form.'
          );
        }

        const selectedOrg = fullData?.organizations?.find(
          (org) => org.id === personData.organizationId
        );

        return e(
          'div',
          { className: 'space-y-6' },
          e(
            'h4',
            { className: 'font-medium text-gray-200 mb-4' },
            'Review Person Information'
          ),

          // Basic Information
          e(
            'div',
            { className: 'bg-gray-700 border border-gray-600 p-4 rounded-lg' },
            e(
              'h5',
              { className: 'font-medium text-gray-200 mb-3' },
              'Basic Information'
            ),
            e(
              'div',
              { className: 'space-y-2 text-sm text-gray-300' },
              e('div', null, `Name: ${personData.name || 'Not provided'}`),
              e(
                'div',
                null,
                `Date of Birth: ${
                  personData.dateOfBirth
                    ? new Date(personData.dateOfBirth).toLocaleDateString()
                    : 'Not provided'
                }`
              ),
              e('div', null, `SSN: ${personData.ssn || 'Not provided'}`)
            )
          ),

          // Contact Information
          e(
            'div',
            { className: 'bg-gray-700 border border-gray-600 p-4 rounded-lg' },
            e(
              'h5',
              { className: 'font-medium text-gray-200 mb-3' },
              'Contact Information'
            ),
            e(
              'div',
              { className: 'space-y-2 text-sm text-gray-300' },
              e('div', null, `Phone: ${personData.phone || 'Not provided'}`),
              e('div', null, `Email: ${personData.email || 'Not provided'}`),
              e(
                'div',
                null,
                personData.address.street ||
                  personData.address.city ||
                  personData.address.state ||
                  personData.address.zip
                  ? `Address: ${[
                      personData.address.street,
                      personData.address.city,
                      personData.address.state,
                      personData.address.zip,
                    ]
                      .filter(Boolean)
                      .join(', ')}`
                  : 'Address: Not provided'
              )
            )
          ),

          // Additional Details
          e(
            'div',
            { className: 'bg-gray-700 border border-gray-600 p-4 rounded-lg' },
            e(
              'h5',
              { className: 'font-medium text-gray-200 mb-3' },
              'Additional Details'
            ),
            e(
              'div',
              { className: 'space-y-2 text-sm text-gray-300' },
              e(
                'div',
                null,
                `Living Arrangement: ${personData.livingArrangement || 'Not specified'}`
              ),
              e('div', null, `Organization: ${selectedOrg?.name || 'None'}`)
            )
          ),

          Object.keys(validationErrors).length > 0 &&
            e(
              'div',
              { className: 'bg-red-900 border border-red-700 rounded-lg p-4' },
              e(
                'h5',
                { className: 'font-medium text-red-200 mb-2' },
                'Please fix the following errors:'
              ),
              e(
                'ul',
                {
                  className:
                    'list-disc list-inside text-sm text-red-300 space-y-1',
                },
                ...Object.entries(validationErrors).map(([field, error]) =>
                  e('li', { key: field }, `${field}: ${error}`)
                )
              )
            )
        );
      }

      default:
        return e('div', null, 'Unknown step');
    }
  }, [
    currentStep,
    personData,
    validationErrors,
    fullData,
    updatePersonData,
    handleMailingAddressSync,
    e,
  ]);

  // Don't render if not open
  if (!isOpen) return null;

  // Render the modal using StepperModal
  return e(
    window.StepperModal,
    {
      isOpen,
      onClose,
      title: editPersonId ? 'Edit Person' : 'Create New Person',
      steps,
      currentStep,
      onStepChange: handleStepChange,
      onComplete: handleSubmit,
      completButtonText: isLoading
        ? 'Saving...'
        : editPersonId
          ? 'Update Person'
          : 'Create Person',
      isCompleteDisabled: isLoading,
    },
    renderStepContent()
  );
}

// Register with the business component system
if (typeof window !== 'undefined') {
  window.PersonCreationModal = PersonCreationModal;

  // Register with Business component library
  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'PersonCreationModal',
      PersonCreationModal
    );
  }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PersonCreationModal };
}
