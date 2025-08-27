// FormComponents - uses global window.React
// Uses global window.dateUtils, window.toInputDateFormat, window.Validators

/**
 * Nightingale Component Library - Form Components
 *
 * Form components that integrate with Nightingale's validation system
 * and provide consistent form experiences across all applications.
 */

/**
 * Form Field Component - wrapper with label, error handling, and validation
 * @param {Object} props - Component props
 * @param {string} props.label - Field label
 * @param {string} props.id - Field ID (auto-generated if not provided)
 * @param {React.Element} props.children - Form input element
 * @param {string|Array} props.error - Error message(s) to display
 * @param {string} props.hint - Help text to display
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.className - Additional CSS classes
 * @returns {React.Element} Form field wrapper
 */
function FormField({
  label,
  id,
  children,
  error = null,
  hint = null,
  required = false,
  className = '',
}) {
  const e = window.React.createElement;

  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const hasError =
    error && (Array.isArray(error) ? error.length > 0 : error.trim() !== '');

  return e(
    'div',
    { className: `space-y-2 ${className}` },

    // Label
    label &&
      e(
        'label',
        {
          htmlFor: fieldId,
          className: 'block text-sm font-medium text-gray-300',
        },
        label,
        required && e('span', { className: 'text-red-400 ml-1' }, '*')
      ),

    // Input wrapper with error styling
    e(
      'div',
      { className: hasError ? 'relative' : '' },
      window.React.isValidElement(children)
        ? window.React.cloneElement(children, {
            id: fieldId,
            className: `${children.props.className || ''} ${
              hasError ? 'border-red-500 focus:ring-red-500' : ''
            }`.trim(),
            'aria-invalid': hasError ? 'true' : undefined,
            'aria-describedby': hasError ? `${fieldId}-error` : undefined,
          })
        : children
    ),

    // Error message(s)
    hasError &&
      e(
        'div',
        {
          id: `${fieldId}-error`,
          className: 'text-red-400 text-sm',
          role: 'alert',
        },
        Array.isArray(error)
          ? error.map((err, index) => e('div', { key: index }, err))
          : error
      ),

    // Hint text
    hint && e('p', { className: 'text-gray-500 text-sm' }, hint)
  );
}

/**
 * Text Input Component - integrates with Nightingale validators
 * @param {Object} props - Component props
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} props.type - Input type: 'text', 'email', 'password', 'tel'
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {function} props.validator - Validation function from Validators
 * @param {function} props.formatter - Formatting function (e.g., formatPhoneNumber)
 * @returns {React.Element} Text input
 */
function TextInput({
  value = '',
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
  className = '',
  validator = null,
  formatter = null,
  ...props
}) {
  const e = window.React.createElement;
  const { useState: useStateHook } = window.React;
  const [, setLocalError] = useStateHook(null);

  const handleChange = (e) => {
    let newValue = e.target.value;

    // Apply formatter if provided (e.g., phone number formatting)
    if (formatter && typeof formatter === 'function') {
      newValue = formatter(newValue);
    }

    // Validate if validator provided
    if (validator && typeof validator === 'function') {
      const result = validator(newValue);
      setLocalError(result.isValid ? null : result.message);

      // Pass sanitized value if available
      if (onChange) {
        onChange({
          ...e,
          target: {
            ...e.target,
            value:
              result.sanitizedValue !== undefined
                ? result.sanitizedValue
                : newValue,
          },
        });
      }
    } else {
      if (onChange) {
        onChange({
          ...e,
          target: { ...e.target, value: newValue },
        });
      }
    }
  };

  const baseClasses = `
    w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2
    text-white placeholder-gray-400
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed
    transition-colors
  `
    .replace(/\s+/g, ' ')
    .trim();

  return e('input', {
    type,
    value,
    onChange: handleChange,
    placeholder,
    disabled,
    className: `${baseClasses} ${className}`,
    ...props,
  });
}

/**
 * Select Component - consistent dropdown styling
 * @param {Object} props - Component props
 * @param {string} props.value - Selected value
 * @param {function} props.onChange - Change handler
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.placeholder - Placeholder option text
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {React.Element} Select dropdown
 */
function Select({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  ...props
}) {
  const e = window.React.createElement;

  const baseClasses = `
    w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2
    text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed
    transition-colors
  `
    .replace(/\s+/g, ' ')
    .trim();

  return e(
    'select',
    {
      value,
      onChange,
      disabled,
      className: `${baseClasses} ${className}`,
      ...props,
    },
    placeholder && e('option', { value: '', disabled: true }, placeholder),
    options.map((option) =>
      e(
        'option',
        {
          key: option.value,
          value: option.value,
        },
        option.label || option.value
      )
    )
  );
}

/**
 * Date Input Component - integrates with Nightingale dateUtils
 * @param {Object} props - Component props
 * @param {string} props.value - Date value (ISO string or YYYY-MM-DD)
 * @param {function} props.onChange - Change handler
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.min - Minimum date (YYYY-MM-DD)
 * @param {string} props.max - Maximum date (YYYY-MM-DD)
 * @param {string} props.className - Additional CSS classes
 * @returns {React.Element} Date input
 */
function DateInput({
  value = '',
  onChange,
  disabled = false,
  min = '',
  max = '',
  className = '',
  ...props
}) {
  const e = window.React.createElement;

  // Convert ISO date to YYYY-MM-DD format for input
  const inputValue = value
    ? typeof window.toInputDateFormat === 'function'
      ? window.toInputDateFormat(value)
      : value.substring(0, 10)
    : '';

  const handleChange = (e) => {
    if (onChange) {
      // Convert back to ISO format if dateUtils available
      const date = e.target.value;
      if (
        date &&
        typeof window.dateUtils !== 'undefined' &&
        window.dateUtils.format
      ) {
        // Create ISO string from date input
        const isoDate = new Date(date + 'T00:00:00').toISOString();
        onChange({
          ...e,
          target: { ...e.target, value: isoDate },
        });
      } else {
        onChange(e);
      }
    }
  };

  const baseClasses = `
    w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2
    text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed
    transition-colors
  `
    .replace(/\s+/g, ' ')
    .trim();

  return e('input', {
    type: 'date',
    value: inputValue,
    onChange: handleChange,
    disabled,
    min,
    max,
    className: `${baseClasses} ${className}`,
    ...props,
  });
}

/**
 * Textarea Component - consistent multi-line text input
 * @param {Object} props - Component props
 * @param {string} props.value - Textarea value
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.rows - Number of rows
 * @param {boolean} props.disabled - Whether textarea is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {React.Element} Textarea
 */
function Textarea({
  value = '',
  onChange,
  placeholder = '',
  rows = 3,
  disabled = false,
  className = '',
  ...props
}) {
  const e = window.React.createElement;

  const baseClasses = `
    w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2
    text-white placeholder-gray-400 resize-none
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed
    transition-colors
  `
    .replace(/\s+/g, ' ')
    .trim();

  return e('textarea', {
    value,
    onChange,
    placeholder,
    rows,
    disabled,
    className: `${baseClasses} ${className}`,
    ...props,
  });
}

/**
 * Checkbox Component - consistent checkbox styling
 * @param {Object} props - Component props
 * @param {boolean} props.checked - Whether checkbox is checked
 * @param {function} props.onChange - Change handler
 * @param {string} props.label - Checkbox label
 * @param {boolean} props.disabled - Whether checkbox is disabled
 * @param {string} props.className - Additional CSS classes
 * @returns {React.Element} Checkbox with label
 */
function Checkbox({
  checked = false,
  onChange,
  label = '',
  disabled = false,
  className = '',
  ...props
}) {
  const e = window.React.createElement;

  const id = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return e(
    'label',
    {
      htmlFor: id,
      className: `flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`,
    },
    e('input', {
      type: 'checkbox',
      id,
      checked,
      onChange,
      disabled,
      className: `
        h-4 w-4 rounded border-gray-500 text-blue-500
        focus:ring-blue-500/50 focus:ring-2
        disabled:cursor-not-allowed
      `
        .replace(/\s+/g, ' ')
        .trim(),
      ...props,
    }),
    label && e('span', { className: 'ml-3 text-gray-300' }, label)
  );
}

// Helper function to create common validators
function createValidator(type, options = {}) {
  if (typeof window.Validators !== 'undefined' && window.Validators[type]) {
    return window.Validators[type](options.message);
  }
  return null;
}

// Export components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormField,
    TextInput,
    Select,
    DateInput,
    Textarea,
    Checkbox,
    createValidator,
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.FormField = FormField;
  window.TextInput = TextInput;
  window.Select = Select;
  window.DateInput = DateInput;
  window.Textarea = Textarea;
  window.Checkbox = Checkbox;
  window.createValidator = createValidator;

  // Register with component system
  if (window.NightingaleComponentLibrary) {
    window.NightingaleComponentLibrary.registerComponent(
      'FormField',
      FormField
    );
    window.NightingaleComponentLibrary.registerComponent(
      'TextInput',
      TextInput
    );
    window.NightingaleComponentLibrary.registerComponent('Select', Select);
    window.NightingaleComponentLibrary.registerComponent(
      'DateInput',
      DateInput
    );
    window.NightingaleComponentLibrary.registerComponent('Textarea', Textarea);
    window.NightingaleComponentLibrary.registerComponent('Checkbox', Checkbox);
  }
}

// ES6 Module Export
export default FormField;
export {
  FormField,
  TextInput,
  Select,
  DateInput,
  Textarea,
  Checkbox,
  createValidator,
};
