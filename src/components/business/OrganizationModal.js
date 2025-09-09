/* eslint-disable react/prop-types */
/**
 * Nightingale Component Library - OrganizationModal
 * Layer: Business (Domain-Specific)
 *
 * Modal for creating and editing organization entries in the Nightingale CMS.
 * Utilizes StepperModal for multi-step workflow with proper validation.
 */
function OrganizationModal({
  isOpen = false,
  onClose = () => {},
  onOrganizationCreated = () => {},
  editOrganizationId = null, // If provided, component will edit existing organization
  fullData = null,
  fileService = null, // File service instance for data operations
}) {
  const e = window.React.createElement;
  const { useState, useEffect, useMemo, useCallback } = window.React;

  // Initial organization data structure
  const getInitialOrganizationData = () => {
    return {
      name: '',
      type: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: 'NE', // Default to Nebraska
        zip: '',
      },
      notes: '',
      personnel: [{ name: '', title: '', email: '', phone: '' }],
      status: 'active',
    };
  };

  // Component state
  const [currentStep, setCurrentStep] = useState(0);
  const [organizationData, setOrganizationData] = useState(
    getInitialOrganizationData(),
  );
  const [originalOrganizationData, setOriginalOrganizationData] = useState(
    getInitialOrganizationData(),
  );
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Load existing organization data for editing
  useEffect(() => {
    if (editOrganizationId && fullData && fullData.organizations) {
      const existingOrganization = fullData.organizations.find(
        (org) => org.id === editOrganizationId,
      );
      if (existingOrganization) {
        // Handle address data - could be string or object format
        let addressData = getInitialOrganizationData().address; // Default structure
        if (existingOrganization.address) {
          if (typeof existingOrganization.address === 'string') {
            // Parse string format: "123 Main St, Springfield, IL 62701"
            const addressParts = existingOrganization.address.split(', ');
            if (addressParts.length >= 3) {
              const [street, city, stateZip] = addressParts;
              const stateZipMatch = stateZip.match(
                /([A-Z]{2})\s+(\d{5}(-\d{4})?)/,
              );
              if (stateZipMatch) {
                addressData = {
                  street: street || '',
                  city: city || '',
                  state: stateZipMatch[1] || 'NE',
                  zip: stateZipMatch[2] || '',
                };
              }
            }
          } else if (typeof existingOrganization.address === 'object') {
            // Already in object format
            addressData = {
              ...getInitialOrganizationData().address,
              ...existingOrganization.address,
            };
          }
        }

        // Ensure personnel is an array
        const personnelData = Array.isArray(existingOrganization.personnel)
          ? existingOrganization.personnel
          : [{ name: '', title: '', email: '', phone: '' }];

        const organizationDataWithDefaults = {
          ...getInitialOrganizationData(),
          ...existingOrganization,
          address: addressData,
          personnel:
            personnelData.length > 0
              ? personnelData
              : [{ name: '', title: '', email: '', phone: '' }],
        };

        setOrganizationData(organizationDataWithDefaults);
        setOriginalOrganizationData(organizationDataWithDefaults);
      }
    } else {
      const initialData = getInitialOrganizationData();
      setOrganizationData(initialData);
      setOriginalOrganizationData(initialData);
    }
  }, [editOrganizationId, fullData, isOpen]);

  // Check if there are any changes from the original data
  const hasChanges = useMemo(() => {
    if (!editOrganizationId) return true; // Always allow saving for new organizations
    return (
      JSON.stringify(organizationData) !==
      JSON.stringify(originalOrganizationData)
    );
  }, [organizationData, originalOrganizationData, editOrganizationId]);

  // Step configuration
  const stepsConfig = useMemo(
    () => [
      {
        title: 'Basic Information',
        description: 'Organization name, type, and primary contact',
      },
      {
        title: 'Contact Information',
        description: 'Phone, email, and address details',
      },
      {
        title: 'Personnel',
        description: 'Key personnel and staff contacts',
      },
      {
        title: 'Review & Save',
        description: 'Confirm information and create organization',
      },
    ],
    [],
  );

  // Create filtered steps config for edit mode (removes Review step)
  const filteredStepsConfig = editOrganizationId
    ? stepsConfig.filter((step) => step.title !== 'Review & Save')
    : stepsConfig;

  // Create steps array for StepperModal
  const steps = filteredStepsConfig.map(({ title, description }) => ({
    title: title || 'Untitled Step',
    description: description || '',
  }));

  // Validation functions
  const validateStep = useCallback(
    (stepIndex) => {
      const validators = window.Validators || {};
      const errors = {};

      try {
        switch (stepIndex) {
          case 0: // Basic Information
            if (!organizationData.name?.trim()) {
              errors.name = 'Organization name is required';
            }
            if (!organizationData.type?.trim()) {
              errors.type = 'Organization type is required';
            }
            break;

          case 1: // Contact Information
            if (organizationData.phone) {
              const phoneValidator = validators.phone?.();
              if (
                phoneValidator &&
                !phoneValidator(organizationData.phone).isValid
              ) {
                errors.phone = 'Invalid phone number format';
              }
            }
            if (organizationData.email) {
              const emailValidator = validators.email?.();
              if (
                emailValidator &&
                !emailValidator(organizationData.email).isValid
              ) {
                errors.email = 'Invalid email format';
              }
            }
            if (!organizationData.address.city?.trim()) {
              errors.city = 'City is required';
            }
            break;

          case 2: // Personnel
            // Validate personnel entries that have at least a name
            organizationData.personnel.forEach((person, index) => {
              if (person.name?.trim()) {
                if (person.email) {
                  const emailValidator = validators.email?.();
                  if (emailValidator && !emailValidator(person.email).isValid) {
                    errors[`personnel_${index}_email`] =
                      `Invalid email format for ${person.name}`;
                  }
                }
              }
            });
            break;

          case 3: {
            // Review & Save - check all previous steps
            const allStepErrors = [0, 1, 2].reduce((acc, step) => {
              return { ...acc, ...validateStep(step) };
            }, {});
            Object.assign(errors, allStepErrors);
            break;
          }
        }

        return errors;
      } catch (error) {
        const logger = window.NightingaleLogger?.get('organization:validate');
        logger?.warn('Organization validation failed', {
          error: error.message,
        });
        return {};
      }
    },
    [organizationData],
  );

  // Handle step change with validation
  const handleStepChange = useCallback(
    (newStep) => {
      if (editOrganizationId) {
        // Edit mode: Allow free navigation to any step
        setValidationErrors({});
        setCurrentStep(newStep);
        return;
      }

      // Creation mode: Validate before advancing
      if (newStep > currentStep) {
        // Validate current step before advancing
        const stepErrors = validateStep(currentStep);
        if (Object.keys(stepErrors).length > 0) {
          setValidationErrors(stepErrors);
          window.showToast?.(
            'Please fix validation errors before continuing',
            'error',
          );
          return;
        }
      }

      setValidationErrors({});
      setCurrentStep(newStep);
    },
    [currentStep, validateStep, editOrganizationId],
  );

  // Handle form data updates
  const updateOrganizationData = useCallback(
    (field, value) => {
      setOrganizationData((prev) => {
        const newData = { ...prev };

        // Handle nested objects (address)
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          newData[parent] = { ...prev[parent], [child]: value };
        } else {
          newData[field] = value;
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
    [validationErrors],
  );

  // Personnel management functions
  const addPersonnel = useCallback(() => {
    setOrganizationData((prev) => ({
      ...prev,
      personnel: [
        ...prev.personnel,
        { name: '', title: '', email: '', phone: '' },
      ],
    }));
  }, []);

  const removePersonnel = useCallback((index) => {
    setOrganizationData((prev) => ({
      ...prev,
      personnel: prev.personnel.filter((_, i) => i !== index),
    }));
  }, []);

  const updatePersonnel = useCallback(
    (index, field, value) => {
      setOrganizationData((prev) => ({
        ...prev,
        personnel: prev.personnel.map((person, i) =>
          i === index ? { ...person, [field]: value } : person,
        ),
      }));

      // Clear validation error for this personnel field
      const errorKey = `personnel_${index}_${field}`;
      if (validationErrors[errorKey]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    },
    [validationErrors],
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Final validation - check all available steps based on mode
    const maxStepIndex = editOrganizationId
      ? filteredStepsConfig.length - 1
      : 3;
    const allStepErrors = [];
    for (let i = 0; i <= maxStepIndex; i++) {
      const stepErrors = validateStep(i);
      allStepErrors.push(stepErrors);
    }
    const finalErrors = allStepErrors.reduce(
      (acc, stepErrors) => ({ ...acc, ...stepErrors }),
      {},
    );

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
        organizations: currentData?.organizations || [],
        nextOrganizationId: currentData?.nextOrganizationId || 1,
      };

      // Filter out empty personnel entries
      const filteredPersonnel = organizationData.personnel.filter(
        (person) =>
          person.name?.trim() ||
          person.title?.trim() ||
          person.email?.trim() ||
          person.phone?.trim(),
      );

      const organizationToSave = {
        ...organizationData,
        personnel: filteredPersonnel,
      };

      let updatedData;
      let successMessage;

      if (editOrganizationId) {
        // Update existing organization
        updatedData = {
          ...safeCurrentData,
          organizations: safeCurrentData.organizations.map((organization) =>
            organization.id === editOrganizationId
              ? {
                  ...organization,
                  ...organizationToSave,
                  // Don't change the original creation date
                  createdAt: organization.createdAt,
                }
              : organization,
          ),
        };
        successMessage = 'Organization updated successfully';
      } else {
        // Create new organization
        const nextOrganizationId = String(
          safeCurrentData.nextOrganizationId || 1,
        );
        const newOrganization = {
          ...organizationToSave,
          id: nextOrganizationId,
          createdAt: dateUtils.now?.() || new Date().toISOString(),
        };

        updatedData = {
          ...safeCurrentData,
          organizations: [...safeCurrentData.organizations, newOrganization],
          nextOrganizationId: parseInt(nextOrganizationId) + 1,
        };
        successMessage = 'Organization created successfully';
      }

      const saveResult = await fileService.writeFile(updatedData);

      if (!saveResult) {
        throw new Error('Failed to save data - writeFile returned false');
      }

      window.showToast?.(successMessage, 'success');

      // Call callback with the created/updated organization
      const resultOrganization = editOrganizationId
        ? updatedData.organizations.find((org) => org.id === editOrganizationId)
        : updatedData.organizations[updatedData.organizations.length - 1];

      onOrganizationCreated(resultOrganization);
      onClose();
    } catch (error) {
      const logger = window.NightingaleLogger?.get('organization:save');
      logger?.error('Organization save failed', { error: error.message });
      window.showToast?.(
        'Error saving organization: ' + error.message,
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    organizationData,
    editOrganizationId,
    onOrganizationCreated,
    onClose,
    validateStep,
    fileService,
    filteredStepsConfig.length,
  ]);

  // Get all US states for dropdown
  const stateOptions = useMemo(
    () => [
      { value: 'AL', label: 'Alabama' },
      { value: 'AK', label: 'Alaska' },
      { value: 'AZ', label: 'Arizona' },
      { value: 'AR', label: 'Arkansas' },
      { value: 'CA', label: 'California' },
      { value: 'CO', label: 'Colorado' },
      { value: 'CT', label: 'Connecticut' },
      { value: 'DE', label: 'Delaware' },
      { value: 'DC', label: 'District of Columbia' },
      { value: 'FL', label: 'Florida' },
      { value: 'GA', label: 'Georgia' },
      { value: 'HI', label: 'Hawaii' },
      { value: 'ID', label: 'Idaho' },
      { value: 'IL', label: 'Illinois' },
      { value: 'IN', label: 'Indiana' },
      { value: 'IA', label: 'Iowa' },
      { value: 'KS', label: 'Kansas' },
      { value: 'KY', label: 'Kentucky' },
      { value: 'LA', label: 'Louisiana' },
      { value: 'ME', label: 'Maine' },
      { value: 'MD', label: 'Maryland' },
      { value: 'MA', label: 'Massachusetts' },
      { value: 'MI', label: 'Michigan' },
      { value: 'MN', label: 'Minnesota' },
      { value: 'MS', label: 'Mississippi' },
      { value: 'MO', label: 'Missouri' },
      { value: 'MT', label: 'Montana' },
      { value: 'NE', label: 'Nebraska' },
      { value: 'NV', label: 'Nevada' },
      { value: 'NH', label: 'New Hampshire' },
      { value: 'NJ', label: 'New Jersey' },
      { value: 'NM', label: 'New Mexico' },
      { value: 'NY', label: 'New York' },
      { value: 'NC', label: 'North Carolina' },
      { value: 'ND', label: 'North Dakota' },
      { value: 'OH', label: 'Ohio' },
      { value: 'OK', label: 'Oklahoma' },
      { value: 'OR', label: 'Oregon' },
      { value: 'PA', label: 'Pennsylvania' },
      { value: 'RI', label: 'Rhode Island' },
      { value: 'SC', label: 'South Carolina' },
      { value: 'SD', label: 'South Dakota' },
      { value: 'TN', label: 'Tennessee' },
      { value: 'TX', label: 'Texas' },
      { value: 'UT', label: 'Utah' },
      { value: 'VT', label: 'Vermont' },
      { value: 'VA', label: 'Virginia' },
      { value: 'WA', label: 'Washington' },
      { value: 'WV', label: 'West Virginia' },
      { value: 'WI', label: 'Wisconsin' },
      { value: 'WY', label: 'Wyoming' },
    ],
    [],
  );

  // Render step content
  const renderStepContent = useCallback(() => {
    const FormField = window.FormField;
    const TextInput = window.TextInput;
    const Select = window.Select;
    const Textarea = window.Textarea;

    if (!FormField || !TextInput) {
      return e(
        'div',
        { className: 'p-4 text-red-600' },
        'Form components not loaded. Please ensure FormComponents.js is loaded.',
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
              label: 'Organization Name',
              required: true,
              error: validationErrors.name,
            },
            e(TextInput, {
              value: organizationData.name,
              onChange: (e) => updateOrganizationData('name', e.target.value),
              placeholder: 'Enter organization name',
              required: true,
            }),
          ),
          e(
            FormField,
            {
              label: 'Organization Type',
              required: true,
              error: validationErrors.type,
              hint: 'e.g., Non-Profit, Government Agency, Healthcare Provider',
            },
            e(TextInput, {
              value: organizationData.type,
              onChange: (e) => updateOrganizationData('type', e.target.value),
              placeholder: 'Enter organization type',
              required: true,
            }),
          ),
          e(
            FormField,
            {
              label: 'Main Phone Number',
              error: validationErrors.phone,
              hint: "Organization's main phone line",
            },
            e(TextInput, {
              value: organizationData.phone,
              onChange: (e) => updateOrganizationData('phone', e.target.value),
              placeholder: '(402) 555-0123',
              type: 'tel',
            }),
          ),
        );

      case 1: // Contact Information
        return e(
          'div',
          { className: 'space-y-4' },
          e(
            FormField,
            {
              label: 'Email Address',
              error: validationErrors.email,
            },
            e(TextInput, {
              value: organizationData.email,
              onChange: (e) => updateOrganizationData('email', e.target.value),
              placeholder: 'info@organization.com',
              type: 'email',
            }),
          ),
          e(
            'h4',
            { className: 'font-medium text-gray-300 mt-6 mb-3' },
            'Address',
          ),
          e(
            FormField,
            {
              label: 'Street Address',
              error: validationErrors.street,
            },
            e(TextInput, {
              value: organizationData.address.street,
              onChange: (e) =>
                updateOrganizationData('address.street', e.target.value),
              placeholder: '123 Main Street',
            }),
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
                value: organizationData.address.city,
                onChange: (e) =>
                  updateOrganizationData('address.city', e.target.value),
                placeholder: 'Lincoln',
                required: true,
              }),
            ),
            e(
              FormField,
              {
                label: 'State',
                required: true,
              },
              e(Select, {
                value: organizationData.address.state,
                onChange: (e) =>
                  updateOrganizationData('address.state', e.target.value),
                options: stateOptions,
                required: true,
              }),
            ),
          ),
          e(
            FormField,
            {
              label: 'ZIP Code',
              error: validationErrors.zip,
            },
            e(TextInput, {
              value: organizationData.address.zip,
              onChange: (e) =>
                updateOrganizationData('address.zip', e.target.value),
              placeholder: '68501',
              maxLength: 10,
            }),
          ),
          e(
            FormField,
            {
              label: 'Notes',
              hint: 'Additional information about this organization',
            },
            e(Textarea, {
              value: organizationData.notes,
              onChange: (e) => updateOrganizationData('notes', e.target.value),
              placeholder: 'Enter any additional notes or information...',
              rows: 3,
            }),
          ),
        );

      case 2: // Personnel
        return e(
          'div',
          { className: 'space-y-4' },
          e(
            'div',
            { className: 'flex justify-between items-center' },
            e(
              'h4',
              { className: 'font-medium text-gray-300' },
              'Key Personnel',
            ),
            e(
              window.SecondaryButton,
              {
                onClick: addPersonnel,
              },
              'Add Person',
            ),
          ),
          e(
            'div',
            { className: 'space-y-4' },
            ...organizationData.personnel.map((person, index) =>
              e(
                'div',
                {
                  key: index,
                  className:
                    'bg-gray-700 border border-gray-600 p-4 rounded-lg space-y-3',
                },
                e(
                  'div',
                  { className: 'flex justify-between items-center' },
                  e(
                    'h5',
                    { className: 'font-medium text-gray-200' },
                    `Person ${index + 1}`,
                  ),
                  organizationData.personnel.length > 1 &&
                    e(
                      window.DangerButton,
                      {
                        onClick: () => removePersonnel(index),
                        size: 'sm',
                      },
                      'Remove',
                    ),
                ),
                e(
                  'div',
                  { className: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
                  e(
                    FormField,
                    {
                      label: 'Name',
                      error: validationErrors[`personnel_${index}_name`],
                    },
                    e(TextInput, {
                      value: person.name,
                      onChange: (e) =>
                        updatePersonnel(index, 'name', e.target.value),
                      placeholder: 'Enter name',
                    }),
                  ),
                  e(
                    FormField,
                    {
                      label: 'Title/Position',
                      error: validationErrors[`personnel_${index}_title`],
                    },
                    e(TextInput, {
                      value: person.title,
                      onChange: (e) =>
                        updatePersonnel(index, 'title', e.target.value),
                      placeholder: 'Enter title or position',
                    }),
                  ),
                  e(
                    FormField,
                    {
                      label: 'Email',
                      error: validationErrors[`personnel_${index}_email`],
                    },
                    e(TextInput, {
                      value: person.email,
                      onChange: (e) =>
                        updatePersonnel(index, 'email', e.target.value),
                      placeholder: 'Enter email address',
                      type: 'email',
                    }),
                  ),
                  e(
                    FormField,
                    {
                      label: 'Phone',
                      error: validationErrors[`personnel_${index}_phone`],
                    },
                    e(TextInput, {
                      value: person.phone,
                      onChange: (e) =>
                        updatePersonnel(index, 'phone', e.target.value),
                      placeholder: '(402) 555-0123',
                      type: 'tel',
                    }),
                  ),
                ),
              ),
            ),
          ),
        );

      case 3: {
        // Review & Save
        if (!organizationData) {
          return e(
            'div',
            { className: 'p-4 text-red-600' },
            'Error: Organization data not available. Please go back and fill out the form.',
          );
        }

        const filteredPersonnel = organizationData.personnel.filter(
          (person) =>
            person.name?.trim() ||
            person.title?.trim() ||
            person.email?.trim() ||
            person.phone?.trim(),
        );

        return e(
          'div',
          { className: 'space-y-6' },
          e(
            'h4',
            { className: 'font-medium text-gray-200 mb-4' },
            'Review Organization Information',
          ),

          // Basic Information
          e(
            'div',
            { className: 'bg-gray-700 border border-gray-600 p-4 rounded-lg' },
            e(
              'h5',
              { className: 'font-medium text-gray-200 mb-3' },
              'Basic Information',
            ),
            e(
              'div',
              { className: 'space-y-2 text-sm text-gray-300' },
              e(
                'div',
                null,
                `Name: ${organizationData.name || 'Not provided'}`,
              ),
              e(
                'div',
                null,
                `Type: ${organizationData.type || 'Not provided'}`,
              ),
            ),
          ),

          // Contact Information
          e(
            'div',
            { className: 'bg-gray-700 border border-gray-600 p-4 rounded-lg' },
            e(
              'h5',
              { className: 'font-medium text-gray-200 mb-3' },
              'Contact Information',
            ),
            e(
              'div',
              { className: 'space-y-2 text-sm text-gray-300' },
              e(
                'div',
                null,
                `Phone: ${organizationData.phone || 'Not provided'}`,
              ),
              e(
                'div',
                null,
                `Email: ${organizationData.email || 'Not provided'}`,
              ),
              e(
                'div',
                null,
                organizationData.address.street ||
                  organizationData.address.city ||
                  organizationData.address.state ||
                  organizationData.address.zip
                  ? `Address: ${[
                      organizationData.address.street,
                      organizationData.address.city,
                      organizationData.address.state,
                      organizationData.address.zip,
                    ]
                      .filter(Boolean)
                      .join(', ')}`
                  : 'Address: Not provided',
              ),
              organizationData.notes &&
                e('div', null, `Notes: ${organizationData.notes}`),
            ),
          ),

          // Personnel
          filteredPersonnel.length > 0 &&
            e(
              'div',
              {
                className: 'bg-gray-700 border border-gray-600 p-4 rounded-lg',
              },
              e(
                'h5',
                { className: 'font-medium text-gray-200 mb-3' },
                'Key Personnel',
              ),
              e(
                'div',
                { className: 'space-y-2 text-sm text-gray-300' },
                ...filteredPersonnel.map((person, index) =>
                  e(
                    'div',
                    {
                      key: index,
                      className: 'border-l-2 border-gray-600 pl-3',
                    },
                    e(
                      'div',
                      { className: 'font-medium' },
                      person.name || 'Unnamed',
                    ),
                    person.title && e('div', null, `Title: ${person.title}`),
                    person.email && e('div', null, `Email: ${person.email}`),
                    person.phone && e('div', null, `Phone: ${person.phone}`),
                  ),
                ),
              ),
            ),

          Object.keys(validationErrors).length > 0 &&
            e(
              'div',
              { className: 'bg-red-900 border border-red-700 rounded-lg p-4' },
              e(
                'h5',
                { className: 'font-medium text-red-200 mb-2' },
                'Please fix the following errors:',
              ),
              e(
                'ul',
                {
                  className:
                    'list-disc list-inside text-sm text-red-300 space-y-1',
                },
                ...Object.entries(validationErrors).map(([field, error]) =>
                  e('li', { key: field }, `${field}: ${error}`),
                ),
              ),
            ),
        );
      }

      default:
        return e('div', null, 'Unknown step');
    }
  }, [
    currentStep,
    organizationData,
    validationErrors,
    updateOrganizationData,
    addPersonnel,
    removePersonnel,
    updatePersonnel,
    stateOptions,
    e,
  ]);

  // Don't render if not open
  if (!isOpen) return null;

  // Custom footer for edit mode - single save button
  const editModeFooter = editOrganizationId
    ? e(
        'div',
        {
          className: 'flex items-center justify-end px-6 py-4 space-x-3',
        },
        e(
          window.OutlineButton,
          {
            onClick: onClose,
          },
          'Cancel',
        ),
        e(
          window.PrimaryButton,
          {
            onClick: handleSubmit,
            disabled: isLoading || !hasChanges,
            loading: isLoading,
          },
          isLoading ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes',
        ),
      )
    : null;

  // Render the modal using StepperModal
  return e(
    window.StepperModal,
    {
      isOpen,
      onClose,
      title: editOrganizationId
        ? 'Edit Organization'
        : 'Create New Organization',
      steps,
      currentStep,
      onStepChange: handleStepChange,
      onComplete: handleSubmit,
      completButtonText: isLoading
        ? 'Saving...'
        : editOrganizationId
          ? 'Update Organization'
          : 'Create Organization',
      isCompleteDisabled: isLoading || (editOrganizationId && !hasChanges),
      customFooterContent: editModeFooter,
    },
    renderStepContent(),
  );
}

// Register with the business component system
if (typeof window !== 'undefined') {
  window.OrganizationModal = OrganizationModal;

  // Register with Business component library
  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'OrganizationModal',
      OrganizationModal,
    );
  }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OrganizationModal };
}

// ES6 Module Export
export default OrganizationModal;
