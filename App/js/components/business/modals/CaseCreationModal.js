// CaseCreationModal - uses component-scoped React patterns
// Note: React hooks declared within component functions for purity

// Access utilities from global window (loaded via script tags)
const getDateUtils = () => window.dateUtils || {};
const getStepsConfig = () => window.stepsConfig || [];

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
    priority: 'Normal',
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

function CaseCreationModal({ isOpen, onClose, fullData, onCaseCreated }) {
  const e = window.React.createElement;
  const { useState: useStateHook, useEffect: useEffectHook } = window.React;

  const [currentStep, setCurrentStep] = useStateHook(0);
  const [caseData, setCaseData] = useStateHook(getInitialCaseData());
  const [errors, setErrors] = useStateHook({});

  // Get steps configuration safely
  const stepsConfig = getStepsConfig();
  const steps = Array.isArray(stepsConfig)
    ? stepsConfig.map(({ title, description }) => ({
        title: title || 'Untitled Step',
        description: description || '',
      }))
    : [];

  const validateStep = (stepIndex) => {
    const stepsConfig = getStepsConfig();
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

    const stepsConfig = getStepsConfig();

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
      } else {
        window.showToast('Please fix the errors before proceeding.', 'warning');
      }
    } else {
      // Allow moving back to any previously accessible step
      if (isStepAccessible(newStep)) {
        setErrors({}); // Clear errors when moving back
        setCurrentStep(newStep);
      }
    }
  };

  const handleComplete = async () => {
    // Final validation of all steps before completing
    const stepsConfig = getStepsConfig();

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
  };

  const renderStepContent = () => {
    const stepsConfig = getStepsConfig();
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
  module.exports = { CaseCreationModal };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CaseCreationModal = CaseCreationModal;

  // Register with component system
  if (window.NightingaleComponentLibrary) {
    window.NightingaleComponentLibrary.registerComponent(
      'CaseCreationModal',
      CaseCreationModal
    );
  }
}
