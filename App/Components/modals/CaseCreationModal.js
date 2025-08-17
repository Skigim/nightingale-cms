// Access React hooks from global window (loaded via script tag)
const { useState, useEffect } = window.React;

// Access utilities from global window (loaded via script tags)
const dateUtils = window.dateUtils;
const StepperModal = window.StepperModal;
const stepsConfig = window.stepsConfig;

const e = window.React.createElement;

const getInitialCaseData = () => ({
  mcn: '',
  personId: '',
  spouseId: '',
  status: 'Pending',
  applicationDate: dateUtils.todayForInput(),
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
});

function CaseCreationModal({ isOpen, onClose, fullData, onCaseCreated }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [caseData, setCaseData] = useState(getInitialCaseData());
  const [errors, setErrors] = useState({});

  const steps = stepsConfig.map(({ title, description }) => ({
    title,
    description,
  }));

  const validateStep = (stepIndex) => {
    const validator = stepsConfig[stepIndex].validator;
    const newErrors = validator(caseData, fullData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepAccessible = (stepIndex) => {
    if (stepIndex === 0) return true;
    for (let i = 0; i < stepIndex; i++) {
      const validator = stepsConfig[i].validator;
      if (Object.keys(validator(caseData, fullData)).length > 0) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
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
    for (let i = 0; i < stepsConfig.length - 1; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        window.showToast(
          `Please fix the errors on the '${stepsConfig[i].title}' step.`,
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
    const CurrentStepComponent = stepsConfig[currentStep].component;
    return e(CurrentStepComponent, {
      caseData,
      updateField,
      errors,
      fullData,
    });
  };

  return e(
    StepperModal,
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
