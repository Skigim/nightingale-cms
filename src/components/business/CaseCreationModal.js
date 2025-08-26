// CaseCreationModal - uses component-scoped React patterns
// Note: React hooks declared within component functions for purity

// Access utilities from global window (loaded via script tags)
const getDateUtils = () => window.dateUtils || {};

const getInitialCaseData = () => {
  const dateUtils = getDateUtils();
  return {
    mcn: '',
    personId: '',
    spouseId: '',
    status: 'Pending',
    applicationDate: dateUtils.todayForInput ? dateUtils.todayForInput() : '',
    description: '',
    caseType: 'LTC',
    priority: false,
    livingArrangement: '',
    withWaiver: false,
    admissionDate: '',
    organizationId: '',
    authorizedReps: [],
    retroRequested: '',
  };
};

// Step Components - Integrated directly into the modal
function BasicInfoStep({ caseData, updateField, validationErrors }) {
  const e = window.React.createElement;

  return e(
    'div',
    { className: 'space-y-4' },
    e(
      window.FormField,
      {
        label: 'Master Case Number (MCN)',
        required: true,
        error: validationErrors.mcn,
      },
      e(window.TextInput, {
        value: caseData.mcn || '',
        onChange: (e) =>
          updateField('mcn', e.target.value.replace(/[^0-9]/g, '')),
        placeholder: 'Enter MCN',
      })
    ),
    e(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      e(
        window.FormField,
        {
          label: 'Application Date',
          required: true,
          error: validationErrors.applicationDate,
        },
        e(window.DateInput, {
          value: caseData.applicationDate,
          onChange: (e) => updateField('applicationDate', e.target.value),
        })
      ),
      e(
        window.FormField,
        {
          label: 'Case Type',
          required: true,
          error: validationErrors.caseType,
        },
        e(window.Select, {
          value: caseData.caseType,
          onChange: (e) => updateField('caseType', e.target.value),
          options: [
            { value: 'LTC', label: 'LTC' },
            { value: 'Waiver', label: 'Waiver' },
            { value: 'SIMP', label: 'SIMP' },
          ],
        })
      )
    ),
    e(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      e(
        window.FormField,
        {
          label: 'Retro Requested?',
          required: true,
          error: validationErrors.retroRequested,
        },
        e(window.Select, {
          value: caseData.retroRequested,
          onChange: (e) => updateField('retroRequested', e.target.value),
          options: [
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
          ],
          placeholder: 'Select...',
        })
      ),
      e(
        window.FormField,
        { label: 'Priority Case' },
        e(window.Select, {
          value: caseData.priority ? 'Yes' : 'No',
          onChange: (e) => updateField('priority', e.target.value === 'Yes'),
          options: [
            { value: 'No', label: 'No' },
            { value: 'Yes', label: 'Yes' },
          ],
        })
      )
    )
  );
}

function ClientSelectionStep({
  fullData,
  caseData,
  updateField,
  validationErrors,
}) {
  const e = window.React.createElement;
  const { useState } = window.React;

  // State for search values
  const [clientSearchValue, setClientSearchValue] = useState('');
  const [spouseSearchValue, setSpouseSearchValue] = useState('');
  const [repSearchValue, setRepSearchValue] = useState('');

  // Find selected client and spouse names
  const selectedClient = fullData?.people?.find(
    (p) => String(p.id) === String(caseData.personId)
  );
  const selectedSpouse = fullData?.people?.find(
    (p) => String(p.id) === String(caseData.spouseId)
  );

  // Filter out client and spouse from rep options
  const repOptions = (fullData?.people || []).filter(
    (p) =>
      String(p.id) !== String(caseData.personId) &&
      String(p.id) !== String(caseData.spouseId)
  );

  // Find selected representative name
  const selectedRep = repOptions.find(
    (r) => String(r.id) === String(caseData.authorizedReps[0])
  );

  // Initialize search values when selections exist
  window.React.useEffect(() => {
    if (selectedClient) {
      setClientSearchValue(selectedClient.name);
    } else {
      setClientSearchValue('');
    }
  }, [selectedClient?.id]);

  window.React.useEffect(() => {
    if (selectedSpouse) {
      setSpouseSearchValue(selectedSpouse.name);
    } else {
      setSpouseSearchValue('');
    }
  }, [selectedSpouse?.id]);

  window.React.useEffect(() => {
    if (selectedRep) {
      setRepSearchValue(selectedRep.name);
    } else {
      setRepSearchValue('');
    }
  }, [selectedRep?.id]);

  const handleClientSelect = (person) => {
    updateField('personId', person.id);
    setClientSearchValue(person.name);
    // Clear spouse if same person selected
    if (String(person.id) === String(caseData.spouseId)) {
      updateField('spouseId', '');
      setSpouseSearchValue('');
    }
  };

  const handleSpouseSelect = (person) => {
    updateField('spouseId', person.id);
    setSpouseSearchValue(person.name);
  };

  const handleClientClear = () => {
    updateField('personId', '');
    setClientSearchValue('');
  };

  const handleSpouseClear = () => {
    updateField('spouseId', '');
    setSpouseSearchValue('');
  };

  const handleRepSelect = (person) => {
    updateField('authorizedReps', [person.id]);
    setRepSearchValue(person.name);
  };

  const handleRepClear = () => {
    updateField('authorizedReps', []);
    setRepSearchValue('');
  };

  // Prepare people data for search
  const peopleData = fullData?.people || [];
  const spouseOptions = peopleData.filter(
    (p) => String(p.id) !== String(caseData.personId)
  );

  return e(
    'div',
    { className: 'space-y-4 case-creation-step', style: { zIndex: 1020 } },
    e(
      window.FormField,
      {
        label: 'Select Client',
        required: true,
        error: validationErrors.personId,
      },
      e(window.SearchBar, {
        value: clientSearchValue,
        onChange: (e) => setClientSearchValue(e.target.value),
        placeholder: 'Search for a client...',
        showDropdown: true,
        data: peopleData,
        searchKeys: ['name', 'id'],
        onResultSelect: handleClientSelect,
        onClear: handleClientClear,
        maxResults: 8,
        minQueryLength: 0,
        className: 'search-dropdown-container search-dropdown-client',
        style: { zIndex: 1110 },
        renderResult: (person) => {
          return e(
            'div',
            { className: 'flex justify-between items-center' },
            e('span', { className: 'font-medium' }, person.name)
          );
        },
      })
    ),
    caseData.caseType === 'SIMP' &&
      e(
        window.FormField,
        {
          label: 'Select Spouse (for SIMP)',
          required: true,
          error: validationErrors.spouseId,
        },
        e(window.SearchBar, {
          value: spouseSearchValue,
          onChange: (e) => setSpouseSearchValue(e.target.value),
          placeholder: 'Search for spouse...',
          showDropdown: true,
          data: spouseOptions,
          searchKeys: ['name', 'id'],
          onResultSelect: handleSpouseSelect,
          onClear: handleSpouseClear,
          maxResults: 8,
          minQueryLength: 0,
          className: 'search-dropdown-container search-dropdown-spouse',
          style: { zIndex: 1100 },
          renderResult: (person) => {
            return e(
              'div',
              { className: 'flex justify-between items-center' },
              e('span', { className: 'font-medium' }, person.name)
            );
          },
        })
      ),
    e(
      window.FormField,
      { label: 'Authorized Representative' },
      e(window.SearchBar, {
        value: repSearchValue,
        onChange: (e) => setRepSearchValue(e.target.value),
        placeholder: 'Search for a representative...',
        showDropdown: true,
        data: repOptions,
        searchKeys: ['name', 'id'],
        onResultSelect: handleRepSelect,
        onClear: handleRepClear,
        maxResults: 8,
        minQueryLength: 0,
        className: 'search-dropdown-container search-dropdown-rep',
        style: { zIndex: 1080 },
        renderResult: (person) => {
          return e(
            'div',
            { className: 'flex justify-between items-center' },
            e('span', { className: 'font-medium' }, person.name)
          );
        },
      })
    )
  );
}

function CaseDetailsStep({
  fullData,
  caseData,
  updateField,
  updatePersonAddress,
  validationErrors,
}) {
  const e = window.React.createElement;
  const { useEffect } = window.React;

  const organizationOptions = (fullData?.organizations || []).map((o) => ({
    value: o.id,
    label: o.name,
  }));

  // Auto-populate living arrangement data from selected person
  useEffect(() => {
    if (caseData.personId && fullData?.people) {
      const selectedPerson = fullData.people.find(
        (p) => String(p.id) === String(caseData.personId)
      );

      if (selectedPerson && selectedPerson.livingArrangement) {
        // Only auto-populate if current living arrangement is empty or default
        if (!caseData.livingArrangement || caseData.livingArrangement === '') {
          updateField('livingArrangement', selectedPerson.livingArrangement);

          // Also populate organization if it exists and living arrangement matches
          if (
            selectedPerson.organizationId &&
            (selectedPerson.livingArrangement === 'Assisted Living' ||
              selectedPerson.livingArrangement === 'Nursing Home')
          ) {
            updateField('organizationId', selectedPerson.organizationId);
          }
        }
      }
    }
  }, [
    caseData.personId,
    caseData.livingArrangement,
    fullData?.people,
    updateField,
  ]);

  // Living arrangement fields based on selected option
  let locationFields = null;
  if (caseData.livingArrangement === 'Apartment/House') {
    const selectedPerson = fullData?.people?.find(
      (p) => String(p.id) === String(caseData.personId)
    );

    locationFields = e(
      'div',
      { className: 'space-y-4 p-4 border border-gray-600 rounded-lg' },
      e(
        'h4',
        { className: 'text-lg font-semibold text-white' },
        'Address Information'
      ),
      selectedPerson
        ? e(
            'div',
            { className: 'space-y-4' },
            e(
              'div',
              { className: 'text-sm text-blue-400 mb-3' },
              'Editing address for: ' + selectedPerson.name
            ),
            e(
              window.FormField,
              {
                label: 'Street Address',
                required: true,
                error: validationErrors.address,
              },
              e(window.TextInput, {
                value: selectedPerson.address?.street || '',
                onChange: (e) => updatePersonAddress('street', e.target.value),
                placeholder: '123 Main Street',
              })
            ),
            e(
              'div',
              { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              e(
                window.FormField,
                { label: 'City', required: true, error: validationErrors.city },
                e(window.TextInput, {
                  value: selectedPerson.address?.city || '',
                  onChange: (e) => updatePersonAddress('city', e.target.value),
                  placeholder: 'Springfield',
                })
              ),
              e(
                window.FormField,
                {
                  label: 'State',
                  required: true,
                  error: validationErrors.state,
                },
                e(window.Select, {
                  value: selectedPerson.address?.state || 'IL',
                  onChange: (e) => updatePersonAddress('state', e.target.value),
                  options: [
                    { value: 'IL', label: 'Illinois' },
                    { value: 'IN', label: 'Indiana' },
                    { value: 'IA', label: 'Iowa' },
                    { value: 'KS', label: 'Kansas' },
                    { value: 'KY', label: 'Kentucky' },
                    { value: 'MI', label: 'Michigan' },
                    { value: 'MN', label: 'Minnesota' },
                    { value: 'MO', label: 'Missouri' },
                    { value: 'NE', label: 'Nebraska' },
                    { value: 'OH', label: 'Ohio' },
                    { value: 'WI', label: 'Wisconsin' },
                  ],
                })
              )
            ),
            e(
              window.FormField,
              {
                label: 'ZIP Code',
                required: true,
                error: validationErrors.zip,
              },
              e(window.TextInput, {
                value: selectedPerson.address?.zip || '',
                onChange: (e) => updatePersonAddress('zip', e.target.value),
                placeholder: '62701',
                maxLength: 10,
              })
            )
          )
        : e(
            'div',
            { className: 'text-sm text-yellow-400' },
            'Please select a person first to edit address information.'
          )
    );
  } else if (
    caseData.livingArrangement === 'Assisted Living' ||
    caseData.livingArrangement === 'Nursing Home'
  ) {
    locationFields = e(
      'div',
      { className: 'p-4 border border-gray-600 rounded-lg' },
      e(
        'h4',
        { className: 'text-lg font-semibold text-white' },
        'Facility Information'
      ),
      e(
        window.FormField,
        {
          label: `Select ${caseData.livingArrangement} Facility`,
          required: true,
          error: validationErrors.organizationId,
        },
        e(window.Select, {
          value: caseData.organizationId,
          onChange: (e) => updateField('organizationId', e.target.value),
          options: organizationOptions,
          placeholder: 'Select a facility...',
        })
      )
    );
  }

  return e(
    'div',
    { className: 'space-y-6 case-creation-step' },
    e(
      'div',
      { className: 'p-4 border border-gray-600 rounded-lg' },
      e(
        'h4',
        { className: 'text-lg font-semibold text-white' },
        'Living Arrangement'
      ),
      e(
        window.FormField,
        {
          label: 'Living Arrangement',
          required: true,
          error: validationErrors.livingArrangement,
        },
        e(window.Select, {
          value: caseData.livingArrangement,
          onChange: (e) => updateField('livingArrangement', e.target.value),
          options: [
            { value: 'Apartment/House', label: 'Apartment/House' },
            { value: 'Assisted Living', label: 'Assisted Living' },
            { value: 'Nursing Home', label: 'Nursing Home' },
            { value: 'Other', label: 'Other' },
          ],
          placeholder: 'Select living arrangement...',
        })
      ),
      (caseData.livingArrangement === 'Apartment/House' ||
        caseData.livingArrangement === 'Assisted Living' ||
        caseData.livingArrangement === 'Nursing Home') &&
        e(
          'div',
          {
            className:
              caseData.livingArrangement === 'Apartment/House'
                ? 'mt-4'
                : 'mt-4 grid grid-cols-1 md:grid-cols-2 gap-4',
          },
          e(
            window.FormField,
            { label: 'With Waiver?' },
            e(window.Select, {
              value: caseData.withWaiver ? 'Yes' : 'No',
              onChange: (e) =>
                updateField('withWaiver', e.target.value === 'Yes'),
              options: [
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes' },
              ],
            })
          ),
          (caseData.livingArrangement === 'Assisted Living' ||
            caseData.livingArrangement === 'Nursing Home') &&
            e(
              window.FormField,
              {
                label: 'Admission Date',
                error: validationErrors.admissionDate,
              },
              e(window.DateInput, {
                value: caseData.admissionDate,
                onChange: (e) => updateField('admissionDate', e.target.value),
              })
            )
        )
    ),
    locationFields
  );
}

function ReviewStep({ fullData, caseData }) {
  const e = window.React.createElement;

  const SummaryItem = ({ label, value }) =>
    e(
      'div',
      { className: 'py-2' },
      e('dt', { className: 'text-sm font-medium text-gray-400' }, label),
      e(
        'dd',
        { className: 'mt-1 text-md text-white' },
        value || e('span', { className: 'text-gray-500' }, 'Not provided')
      )
    );

  const clientName = fullData?.people.find(
    (p) => String(p.id) === String(caseData.personId)
  )?.name;
  const spouseName =
    caseData.caseType === 'SIMP'
      ? fullData?.people.find((p) => String(p.id) === String(caseData.spouseId))
          ?.name
      : null;
  const orgName = fullData?.organizations.find(
    (o) => String(o.id) === String(caseData.organizationId)
  )?.name;
  const repNames = caseData.authorizedReps
    .map(
      (repId) =>
        fullData?.people.find((r) => String(r.id) === String(repId))?.name
    )
    .join(', ');

  return e(
    'div',
    { className: 'space-y-6' },
    e(
      'h3',
      { className: 'text-xl font-bold text-white' },
      'Review Case Details'
    ),
    e(
      'dl',
      { className: 'divide-y divide-gray-700' },
      e(SummaryItem, { label: 'MCN', value: caseData.mcn }),
      e(SummaryItem, { label: 'Client', value: clientName }),
      spouseName && e(SummaryItem, { label: 'Spouse', value: spouseName }),
      e(SummaryItem, { label: 'Authorized Reps', value: repNames }),
      e(SummaryItem, { label: 'Case Type', value: caseData.caseType }),
      e(SummaryItem, {
        label: 'Application Date',
        value: window.dateUtils?.format
          ? window.dateUtils.format(caseData.applicationDate)
          : caseData.applicationDate,
      }),
      e(SummaryItem, {
        label: 'Retro Requested',
        value: caseData.retroRequested,
      }),
      e(SummaryItem, {
        label: 'Priority Case',
        value: caseData.priority ? 'Yes' : 'No',
      }),
      e(SummaryItem, {
        label: 'Living Arrangement',
        value: caseData.livingArrangement,
      }),
      (caseData.livingArrangement === 'Apartment/House' ||
        caseData.livingArrangement === 'Assisted Living' ||
        caseData.livingArrangement === 'Nursing Home') &&
        e(SummaryItem, {
          label: 'With Waiver',
          value: caseData.withWaiver ? 'Yes' : 'No',
        }),
      (caseData.livingArrangement === 'Assisted Living' ||
        caseData.livingArrangement === 'Nursing Home') &&
        caseData.admissionDate &&
        e(SummaryItem, {
          label: 'Admission Date',
          value: window.dateUtils?.format
            ? window.dateUtils.format(caseData.admissionDate)
            : caseData.admissionDate,
        }),
      caseData.livingArrangement === 'Apartment/House' &&
        clientName &&
        (() => {
          const selectedPerson = fullData?.people.find(
            (p) => String(p.id) === String(caseData.personId)
          );
          if (selectedPerson?.address) {
            const addressParts = [
              selectedPerson.address.street,
              selectedPerson.address.city,
              selectedPerson.address.state,
              selectedPerson.address.zip,
            ].filter(Boolean);
            return addressParts.length > 0
              ? e(SummaryItem, {
                  label: 'Address',
                  value: addressParts.join(', '),
                })
              : null;
          }
          return null;
        })(),
      orgName && e(SummaryItem, { label: 'Facility', value: orgName }),
      e(SummaryItem, { label: 'Description', value: caseData.description })
    )
  );
}

// Steps Configuration - Integrated directly into the modal
const stepsConfig = [
  {
    title: 'Basic Information',
    description: 'MCN and case type',
    component: BasicInfoStep,
    validator: (data) => {
      const newErrors = {};
      if (!data.mcn?.trim()) newErrors.mcn = 'MCN is required.';
      if (!data.applicationDate)
        newErrors.applicationDate = 'Application date is required.';
      if (!data.caseType) newErrors.caseType = 'Case type is required.';
      if (!data.retroRequested)
        newErrors.retroRequested = 'Retro requested selection is required.';
      return newErrors;
    },
  },
  {
    title: 'Client Selection',
    description: 'Select client, spouse, and representative',
    component: ClientSelectionStep,
    validator: (data) => {
      const newErrors = {};
      if (!data.personId) newErrors.personId = 'Client selection is required.';
      if (data.caseType === 'SIMP' && !data.spouseId) {
        newErrors.spouseId = 'Spouse selection is required for SIMP cases.';
      }
      return newErrors;
    },
  },
  {
    title: 'Living Arrangement',
    description: 'Living situation and location',
    component: CaseDetailsStep,
    validator: (data) => {
      const newErrors = {};
      if (!data.livingArrangement) {
        newErrors.livingArrangement = 'Living arrangement is required.';
      }
      // Note: Address validation is handled at the person level, not case level
      if (
        (data.livingArrangement === 'Assisted Living' ||
          data.livingArrangement === 'Nursing Home') &&
        !data.organizationId
      ) {
        newErrors.organizationId = 'Facility selection is required.';
      }
      return newErrors;
    },
  },
  {
    title: 'Review',
    description: 'Confirm and create',
    component: ReviewStep,
    validator: () => ({}), // No validation on the review step
  },
];

/* eslint-disable react/prop-types */
/**
 * Nightingale Component Library - CaseCreationModal
 * Layer: Business (Domain-Specific)
 *
 * Modal for creating and editing case entries in the Nightingale CMS.
 * Utilizes StepperModal for multi-step workflow with proper validation.
 */
function CaseCreationModal({
  isOpen = false,
  onClose = () => {},
  onCaseCreated = () => {},
  editCaseId = null, // If provided, component will edit existing case
  fullData = null,
  fileService = null, // File service instance for data operations
  onViewCaseDetails = null, // Callback to switch to case details view
}) {
  const e = window.React.createElement;
  const { useState, useEffect, useMemo, useCallback } = window.React;

  const [currentStep, setCurrentStep] = useState(0);
  const [caseData, setCaseData] = useState(getInitialCaseData());
  const [originalCaseData, setOriginalCaseData] =
    useState(getInitialCaseData());
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Create filtered steps config for edit mode (removes Review step)
  const filteredStepsConfig = editCaseId
    ? stepsConfig.filter((step) => step.title !== 'Review')
    : stepsConfig;

  // Create steps array for StepperModal
  const steps = filteredStepsConfig.map(({ title, description }) => ({
    title: title || 'Untitled Step',
    description: description || '',
  }));

  // Load existing case data for editing
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open

    if (editCaseId && fullData && fullData.cases) {
      const existingCase = fullData.cases.find((c) => c.id === editCaseId);
      if (existingCase) {
        const caseDataWithDefaults = {
          ...getInitialCaseData(),
          ...existingCase,
        };
        setCaseData(caseDataWithDefaults);
        setOriginalCaseData(caseDataWithDefaults);
      }
    } else {
      const initialData = getInitialCaseData();
      setCaseData(initialData);
      setOriginalCaseData(initialData);
    }
  }, [editCaseId, fullData, isOpen]); // Check if there are any changes from the original data
  const hasChanges = useMemo(() => {
    if (!editCaseId) return true; // Always allow saving for new cases
    return JSON.stringify(caseData) !== JSON.stringify(originalCaseData);
  }, [caseData, originalCaseData, editCaseId]);

  const validateStep = useCallback(
    (stepIndex) => {
      const configToUse = editCaseId ? filteredStepsConfig : stepsConfig;
      const stepConfig = configToUse[stepIndex];

      if (!stepConfig || !stepConfig.validator) {
        return {}; // Return empty errors object instead of boolean
      }

      // Add defensive check for fullData to handle legacy files
      const safeFullData = fullData || {
        people: [],
        organizations: [],
        cases: [],
      };

      try {
        const validator = stepConfig.validator;
        const newErrors = validator(caseData, safeFullData);
        return newErrors;
      } catch (error) {
        console.warn(`Step validation error for step ${stepIndex}:`, error);
        // In case of validation error, return empty errors (allow the step)
        return {};
      }
    },
    [editCaseId, filteredStepsConfig, caseData, fullData]
  );

  useEffect(() => {
    if (isOpen && !editCaseId) {
      // Only reset for create mode
      setCaseData(getInitialCaseData());
      setCurrentStep(0);
      setValidationErrors({});
    }
  }, [isOpen, editCaseId]);

  const handleStepChange = useCallback(
    (newStep) => {
      if (editCaseId) {
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
            'error'
          );
          return;
        }
      }

      setValidationErrors({});
      setCurrentStep(newStep);
    },
    [currentStep, validateStep, editCaseId, setCurrentStep, setValidationErrors]
  );

  const handleComplete = async () => {
    // Final validation of all steps before completing
    const configToUse = editCaseId ? filteredStepsConfig : stepsConfig;
    const maxStepIndex = editCaseId
      ? configToUse.length - 1
      : stepsConfig.length - 1;

    for (let i = 0; i <= maxStepIndex; i++) {
      const stepErrors = validateStep(i);
      if (Object.keys(stepErrors).length > 0) {
        setValidationErrors(stepErrors);
        setCurrentStep(i);
        const stepTitle = configToUse[i]?.title || `Step ${i + 1}`;
        window.showToast(
          `Please fix the errors on the '${stepTitle}' step.`,
          'error'
        );
        return;
      }
    }

    try {
      setIsLoading(true);
      if (!fileService) {
        throw new Error('File service not available');
      }

      const currentData = await fileService.readFile();

      let updatedData;
      let resultCase;
      let successMessage;

      if (editCaseId) {
        // Update existing case
        updatedData = {
          ...currentData,
          cases: currentData.cases.map((caseItem) =>
            caseItem.id === editCaseId
              ? {
                  ...caseItem,
                  ...caseData,
                  updatedDate: new Date().toISOString(),
                  // Don't change the original creation date
                  createdDate: caseItem.createdDate,
                  id: caseItem.id, // Keep the original ID
                }
              : caseItem
          ),
        };
        resultCase = updatedData.cases.find((c) => c.id === editCaseId);
        successMessage = 'Case updated successfully!';
      } else {
        // Create new case
        const newCase = {
          id: `case-${Date.now()}`,
          ...caseData,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
        };

        updatedData = {
          ...currentData,
          cases: [...(currentData.cases || []), newCase],
        };
        resultCase = newCase;
        successMessage = 'Case created successfully!';
      }

      // If a person was selected and living arrangement data was modified,
      // update the person's record with the new living arrangement info
      if (caseData.personId && updatedData?.people) {
        const personIndex = updatedData.people.findIndex(
          (p) => String(p.id) === String(caseData.personId)
        );

        if (personIndex !== -1) {
          // Update person's living arrangement data
          updatedData.people[personIndex] = {
            ...updatedData.people[personIndex],
            livingArrangement: caseData.livingArrangement,
            organizationId: caseData.organizationId || null,
          };
        }
      }

      const saveResult = await fileService.writeFile(updatedData);
      if (!saveResult) {
        throw new Error('Failed to save data - writeFile returned false');
      }

      onCaseCreated(resultCase);
      window.showToast(successMessage, 'success');
      onClose();
    } catch (error) {
      console.error('Error saving case:', error);
      window.showToast('Error saving case: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field, value) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Update person's living arrangement data when relevant fields change
    if (
      caseData.personId &&
      (field === 'livingArrangement' || field === 'organizationId') &&
      fullData?.people
    ) {
      const personIndex = fullData.people.findIndex(
        (p) => String(p.id) === String(caseData.personId)
      );

      if (personIndex !== -1) {
        // Update the person's data in the fullData object
        // Note: This is a direct mutation for immediate UI updates
        // The actual save will happen when the case is created
        if (field === 'livingArrangement') {
          fullData.people[personIndex].livingArrangement = value;
          // Clear organizationId if switching to Apartment/House or Other
          if (value === 'Apartment/House' || value === 'Other') {
            fullData.people[personIndex].organizationId = null;
          }
        } else if (field === 'organizationId') {
          fullData.people[personIndex].organizationId = value;
        }
      }
    }
  };

  const updatePersonAddress = (addressField, value) => {
    if (!caseData.personId || !fullData?.people) return;

    const personIndex = fullData.people.findIndex(
      (p) => String(p.id) === String(caseData.personId)
    );

    if (personIndex !== -1) {
      // Ensure address object exists
      if (!fullData.people[personIndex].address) {
        fullData.people[personIndex].address = {};
      }

      // Update the address field
      fullData.people[personIndex].address[addressField] = value;

      // Also update mailing address if it matches physical address
      if (fullData.people[personIndex].mailingAddress?.sameAsPhysical) {
        if (!fullData.people[personIndex].mailingAddress) {
          fullData.people[personIndex].mailingAddress = {};
        }
        fullData.people[personIndex].mailingAddress[addressField] = value;
      }

      // Clear validation errors for address fields
      const addressErrors = ['address', 'city', 'state', 'zip'];
      if (addressErrors.includes(addressField)) {
        setValidationErrors((prev) => ({ ...prev, [addressField]: undefined }));
      }

      // Force a re-render by updating a timestamp or similar
      setCaseData((prev) => ({ ...prev, lastUpdated: Date.now() }));
    }
  };

  const renderStepContent = () => {
    const currentStepConfig = filteredStepsConfig[currentStep];

    if (!currentStepConfig || !currentStepConfig.component) {
      return e(
        'div',
        { className: 'p-4 text-center text-gray-500' },
        'Step configuration not found'
      );
    }

    const CurrentStepComponent = currentStepConfig.component;
    return e(CurrentStepComponent, {
      caseData,
      updateField,
      updatePersonAddress,
      validationErrors,
      fullData,
    });
  };

  // Custom footer for edit mode - with View Full Case option
  const editModeFooter = editCaseId
    ? e(
        'div',
        {
          className: 'flex items-center justify-between px-6 py-4',
        },
        e(
          window.Button,
          {
            variant: 'outline',
            onClick: () => {
              if (onViewCaseDetails) {
                onClose(); // Close the modal first
                onViewCaseDetails(editCaseId); // Switch to case details view
              } else {
                console.log('View Full Case clicked for case:', editCaseId);
                console.warn('onViewCaseDetails callback not provided');
              }
            },
            icon: 'view',
          },
          'View Full Case'
        ),
        e(
          'div',
          { className: 'flex space-x-3 ml-6' }, // Added ml-6 for padding between sections
          e(
            window.OutlineButton,
            {
              onClick: onClose,
            },
            'Cancel'
          ),
          e(
            window.PrimaryButton,
            {
              onClick: handleComplete,
              disabled: !hasChanges,
            },
            hasChanges ? 'Save Changes' : 'No Changes'
          )
        )
      )
    : null;

  return e(
    window.StepperModal,
    {
      isOpen,
      onClose,
      title: editCaseId ? 'Edit Case' : 'Create New Case',
      steps,
      currentStep,
      onStepChange: handleStepChange,
      onComplete: handleComplete,
      completButtonText: isLoading
        ? 'Saving...'
        : editCaseId
          ? 'Update Case'
          : 'Create Case',
      isCompleteDisabled: isLoading || (editCaseId && !hasChanges),
      customFooterContent: editModeFooter,
    },
    renderStepContent()
  );
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CaseCreationModal,
    BasicInfoStep,
    ClientSelectionStep,
    CaseDetailsStep,
    ReviewStep,
    stepsConfig,
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CaseCreationModal = CaseCreationModal;

  // Also make individual components available for backward compatibility
  window.BasicInfoStep = BasicInfoStep;
  window.ClientSelectionStep = ClientSelectionStep;
  window.CaseDetailsStep = CaseDetailsStep;
  window.ReviewStep = ReviewStep;
  window.stepsConfig = stepsConfig;

  // Register with component system
  if (window.NightingaleComponentLibrary) {
    window.NightingaleComponentLibrary.registerComponent(
      'CaseCreationModal',
      CaseCreationModal
    );
  }
}
