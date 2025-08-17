// CaseCreationSteps configuration - uses global window.React
// Uses global window.window.dateUtils and global window form components

const e = window.React.createElement;

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
    description: 'Select or create client',
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
    title: 'Case Details',
    description: 'Address and representatives',
    component: CaseDetailsStep,
    validator: (data, fullData) => {
      const newErrors = {};
      const livingArrangement = fullData?.people.find(
        (p) => String(p.id) === String(data.personId)
      )?.livingArrangement;
      if (livingArrangement === 'Home') {
        if (!data.address?.trim()) newErrors.address = 'Address is required.';
        if (!data.city?.trim()) newErrors.city = 'City is required.';
        if (!data.state?.trim()) newErrors.state = 'State is required.';
        if (!data.zipCode?.trim()) newErrors.zipCode = 'Zip code is required.';
      } else if (
        livingArrangement === 'LTC' ||
        livingArrangement === 'Assisted Living'
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

function BasicInfoStep({ caseData, updateField, errors }) {
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
    )
  );
}

function ClientSelectionStep({ fullData, caseData, updateField, errors }) {
  const peopleOptions = (fullData?.people || []).map((p) => ({
    value: p.id,
    label: `${p.name} (ID: ${p.id})`,
  }));
  return e(
    'div',
    { className: 'space-y-4' },
    e(
      window.FormField,
      { label: 'Select Client', required: true, error: errors.personId },
      e(window.Select, {
        value: caseData.personId,
        onChange: (e) => updateField('personId', e.target.value),
        options: peopleOptions,
        placeholder: 'Select a client...',
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
        e(window.Select, {
          value: caseData.spouseId,
          onChange: (e) => updateField('spouseId', e.target.value),
          options: peopleOptions.filter(
            (p) => String(p.value) !== String(caseData.personId)
          ),
          placeholder: 'Select spouse...',
        })
      )
  );
}

function CaseDetailsStep({ fullData, caseData, updateField, errors }) {
  const livingArrangement = fullData?.people.find(
    (p) => String(p.id) === String(caseData.personId)
  )?.livingArrangement;
  const organizationOptions = (fullData?.organizations || []).map((o) => ({
    value: o.id,
    label: o.name,
  }));
  const repOptions = (fullData?.people || [])
    .filter(
      (p) =>
        String(p.id) !== String(caseData.personId) &&
        String(p.id) !== String(caseData.spouseId)
    )
    .map((r) => ({ value: r.id, label: r.name }));

  let locationFields = null;
  if (livingArrangement === 'Home') {
    locationFields = e(
      'div',
      { className: 'space-y-4 p-4 border border-gray-600 rounded-lg' },
      e(
        'h4',
        { className: 'text-lg font-semibold text-white' },
        'Home Address'
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
    livingArrangement === 'LTC' ||
    livingArrangement === 'Assisted Living'
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
          label: `Select ${livingArrangement} Facility`,
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
    { className: 'space-y-6' },
    locationFields,
    e(
      'div',
      { className: 'p-4 border border-gray-600 rounded-lg' },
      e(
        'h4',
        { className: 'text-lg font-semibold text-white' },
        'Additional Details'
      ),
      e(
        window.FormField,
        { label: 'Authorized Representatives' },
        e(window.Select, {
          // Simple select for now - can be enhanced to multi-select later
          value: caseData.authorizedReps[0] || '',
          onChange: (e) =>
            updateField(
              'authorizedReps',
              e.target.value ? [e.target.value] : []
            ),
          options: repOptions,
          placeholder: 'Select a representative...',
        })
      ),
      e(
        window.FormField,
        { label: 'Priority' },
        e(window.Select, {
          value: caseData.priority,
          onChange: (e) => updateField('priority', e.target.value),
          options: [
            { value: 'Low', label: 'Low' },
            { value: 'Normal', label: 'Normal' },
            { value: 'High', label: 'High' },
          ],
        })
      ),
      e(
        window.FormField,
        { label: 'Description / Notes' },
        e(window.TextArea, {
          value: caseData.description,
          onChange: (e) => updateField('description', e.target.value),
          rows: 3,
        })
      )
    )
  );
}

function ReviewStep({ fullData, caseData }) {
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
  const livingArrangement = fullData?.people.find(
    (p) => String(p.id) === String(caseData.personId)
  )?.livingArrangement;

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
      e(SummaryItem, { label: 'Case Type', value: caseData.caseType }),
      e(SummaryItem, {
        label: 'Application Date',
        value: window.dateUtils.format(caseData.applicationDate),
      }),
      e(SummaryItem, {
        label: 'Retro Requested',
        value: caseData.retroRequested,
      }),
      e(SummaryItem, { label: 'Priority', value: caseData.priority }),
      livingArrangement === 'Home' &&
        e(SummaryItem, {
          label: 'Address',
          value: `${caseData.address}, ${caseData.city}, ${caseData.state} ${caseData.zipCode}`,
        }),
      orgName && e(SummaryItem, { label: 'Facility', value: orgName }),
      e(SummaryItem, { label: 'Authorized Reps', value: repNames }),
      e(SummaryItem, { label: 'Description', value: caseData.description })
    )
  );
}

// Export the steps configuration and components
window.CaseCreationSteps = {
  stepsConfig,
  BasicInfoStep,
  ClientSelectionStep,
  CaseDetailsStep,
  ReviewStep,
};
