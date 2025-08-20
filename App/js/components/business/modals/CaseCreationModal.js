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
    address: '',
    unit: '',
    city: '',
    state: '',
    zipCode: '',
    organizationId: '',
    authorizedReps: [],
    retroRequested: '',
  };
};

// Step Components - Integrated directly into the modal
function BasicInfoStep({ caseData, updateField, errors }) {
  const e = window.React.createElement;

  return e(
    'div',
    { className: 'space-y-4' },
    e(
      window.FormField,
      { label: 'Master Case Number (MCN)', required: true, error: errors.mcn },
      e(window.TextInput, {
        value: caseData.mcn,
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
          error: errors.applicationDate,
        },
        e(window.DateInput, {
          value: caseData.applicationDate,
          onChange: (e) => updateField('applicationDate', e.target.value),
        })
      ),
      e(
        window.FormField,
        { label: 'Case Type', required: true, error: errors.caseType },
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
          error: errors.retroRequested,
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

function ClientSelectionStep({ fullData, caseData, updateField, errors }) {
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
      { label: 'Select Client', required: true, error: errors.personId },
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
          error: errors.spouseId,
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

function CaseDetailsStep({ fullData, caseData, updateField, errors }) {
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
    locationFields = e(
      'div',
      { className: 'space-y-4 p-4 border border-gray-600 rounded-lg' },
      e(
        'h4',
        { className: 'text-lg font-semibold text-white' },
        'Address Information'
      ),
      e(
        window.FormField,
        { label: 'Address', required: true, error: errors.address },
        e(window.TextInput, {
          value: caseData.address,
          onChange: (e) => updateField('address', e.target.value),
        })
      ),
      e(
        window.FormField,
        { label: 'Unit/Apt', error: errors.unit },
        e(window.TextInput, {
          value: caseData.unit,
          onChange: (e) => updateField('unit', e.target.value),
        })
      ),
      e(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
        e(
          window.FormField,
          { label: 'City', required: true, error: errors.city },
          e(window.TextInput, {
            value: caseData.city,
            onChange: (e) => updateField('city', e.target.value),
          })
        ),
        e(
          window.FormField,
          { label: 'State', required: true, error: errors.state },
          e(window.TextInput, {
            value: caseData.state,
            onChange: (e) => updateField('state', e.target.value),
          })
        ),
        e(
          window.FormField,
          { label: 'Zip Code', required: true, error: errors.zipCode },
          e(window.TextInput, {
            value: caseData.zipCode,
            onChange: (e) => updateField('zipCode', e.target.value),
          })
        )
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
          error: errors.organizationId,
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
          error: errors.livingArrangement,
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
              { label: 'Admission Date', error: errors.admissionDate },
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
        caseData.address &&
        e(SummaryItem, {
          label: 'Address',
          value: `${caseData.address}${caseData.unit ? `, ${caseData.unit}` : ''}, ${caseData.city}, ${caseData.state} ${caseData.zipCode}`,
        }),
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
      if (data.livingArrangement === 'Apartment/House') {
        if (!data.address?.trim()) newErrors.address = 'Address is required.';
        if (!data.city?.trim()) newErrors.city = 'City is required.';
        if (!data.state?.trim()) newErrors.state = 'State is required.';
        if (!data.zipCode?.trim()) newErrors.zipCode = 'Zip code is required.';
      } else if (
        data.livingArrangement === 'Assisted Living' ||
        data.livingArrangement === 'Nursing Home'
      ) {
        if (!data.organizationId)
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

function CaseCreationModal({ isOpen, onClose, fullData, onCaseCreated }) {
  const e = window.React.createElement;
  const { useState: useStateHook, useEffect: useEffectHook } = window.React;

  const [currentStep, setCurrentStep] = useStateHook(0);
  const [caseData, setCaseData] = useStateHook(getInitialCaseData());
  const [errors, setErrors] = useStateHook({});

  // Create steps array for StepperModal
  const steps = stepsConfig.map(({ title, description }) => ({
    title: title || 'Untitled Step',
    description: description || '',
  }));

  const validateStep = (stepIndex) => {
    const stepConfig = stepsConfig[stepIndex];

    if (!stepConfig || !stepConfig.validator) {
      return true; // Default to valid if no validator
    }

    const validator = stepConfig.validator;
    const newErrors = validator(caseData, fullData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepAccessible = (stepIndex) => {
    if (stepIndex === 0) return true;

    for (let i = 0; i < stepIndex; i++) {
      const stepConfig = stepsConfig[i];
      if (!stepConfig || !stepConfig.validator) {
        continue; // Skip if no validator available
      }

      const validator = stepConfig.validator;
      if (Object.keys(validator(caseData, fullData)).length > 0) {
        return false;
      }
    }
    return true;
  };

  useEffectHook(() => {
    if (isOpen) {
      setCaseData(getInitialCaseData());
      setCurrentStep(0);
      setErrors({});
    }
  }, [isOpen]);

  const handleStepChange = (newStep) => {
    if (newStep > currentStep) {
      if (validateStep(currentStep)) {
        setCurrentStep(newStep);
        // Enhanced focus management for step progression
        if (window.NightingaleFocusManager) {
          setTimeout(() => {
            window.NightingaleFocusManager.focusStepChange(
              '.stepper-modal .w-3/4', // Target the step content area
              newStep,
              {
                onFocused: (element) => {
                  console.debug(
                    `Case creation step ${newStep + 1} focused:`,
                    element.tagName
                  );
                },
              }
            );
          }, 100);
        }
      } else {
        window.showToast('Please fix the errors before proceeding.', 'warning');
      }
    } else {
      // Allow moving back to any previously accessible step
      if (isStepAccessible(newStep)) {
        setErrors({}); // Clear errors when moving back
        setCurrentStep(newStep);
        // Enhanced focus management for step regression
        if (window.NightingaleFocusManager) {
          setTimeout(() => {
            window.NightingaleFocusManager.focusStepChange(
              '.stepper-modal .w-3/4', // Target the step content area
              newStep,
              {
                onFocused: (element) => {
                  console.debug(
                    `Case creation step ${newStep + 1} focused (back):`,
                    element.tagName
                  );
                },
              }
            );
          }, 100);
        }
      }
    }
  };

  const handleComplete = async () => {
    // Final validation of all steps before completing
    for (let i = 0; i < stepsConfig.length - 1; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        const stepTitle = stepsConfig[i]?.title || `Step ${i + 1}`;
        window.showToast(
          `Please fix the errors on the '${stepTitle}' step.`,
          'error'
        );
        return;
      }
    }

    try {
      const newCase = {
        id: `case-${Date.now()}`,
        ...caseData,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };

      // If a person was selected and living arrangement data was modified,
      // update the person's record with the new living arrangement info
      if (caseData.personId && fullData?.people) {
        const personIndex = fullData.people.findIndex(
          (p) => String(p.id) === String(caseData.personId)
        );

        if (personIndex !== -1) {
          // Update person's living arrangement data
          fullData.people[personIndex] = {
            ...fullData.people[personIndex],
            livingArrangement: caseData.livingArrangement,
            organizationId: caseData.organizationId || null,
          };

          // Note: The parent component should handle saving the updated fullData
          // This ensures the person's living arrangement is kept in sync
        }
      }

      onCaseCreated(newCase);
      window.showToast('Case created successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error creating case:', error);
      window.showToast(
        'Error creating case. See console for details.',
        'error'
      );
    }
  };

  const updateField = (field, value) => {
    setCaseData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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

  const renderStepContent = () => {
    const currentStepConfig = stepsConfig[currentStep];

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
      errors,
      fullData,
    });
  };

  return e(
    window.StepperModal,
    {
      isOpen,
      onClose,
      title: 'Create New Case',
      steps,
      currentStep,
      onStepChange: handleStepChange,
      onComplete: handleComplete,
      isStepClickable: isStepAccessible,
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
