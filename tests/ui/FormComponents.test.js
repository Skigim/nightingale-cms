import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  FormField,
  TextInput,
  Select,
  DateInput,
  Textarea,
  Checkbox,
  createValidator,
} from '../../src/components/ui/FormComponents.jsx';

describe('FormField Component', () => {
  test('renders with label and input', () => {
    render(
      <FormField
        label="Test Field"
        id="test-field"
      >
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('shows required asterisk when required prop is true', () => {
    render(
      <FormField
        label="Required Field"
        required
      >
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('displays error message', () => {
    render(
      <FormField
        label="Field with Error"
        error="This field is required"
      >
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This field is required',
    );
  });

  test('displays multiple error messages', () => {
    const errors = ['Error 1', 'Error 2'];
    render(
      <FormField
        label="Field with Errors"
        error={errors}
      >
        <input type="text" />
      </FormField>,
    );

    errors.forEach((error) => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  test('displays hint text', () => {
    render(
      <FormField
        label="Field with Hint"
        hint="This is a helpful hint"
      >
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByText('This is a helpful hint')).toBeInTheDocument();
  });

  test('adds error styling to input when error present', () => {
    render(
      <FormField
        label="Field with Error"
        error="Error message"
      >
        <input
          type="text"
          data-testid="input"
        />
      </FormField>,
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('generates unique ID when not provided', () => {
    render(
      <FormField label="Auto ID Field">
        <input
          type="text"
          data-testid="input"
        />
      </FormField>,
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('id');
    expect(input.id).toMatch(/^field-/);
  });
});

describe('TextInput Component', () => {
  test('renders with default props', () => {
    render(<TextInput />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('type', 'text');
  });

  test('handles value and onChange', () => {
    const mockOnChange = jest.fn();

    render(
      <TextInput
        value="initial"
        onChange={mockOnChange}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');

    fireEvent.change(input, { target: { value: 'initial text' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('applies different input types', () => {
    const { rerender } = render(<TextInput type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<TextInput type="password" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
  });

  test('handles disabled state', () => {
    render(<TextInput disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-600');
  });

  test('applies custom className', () => {
    render(<TextInput className="custom-class" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  test('calls formatter when provided', () => {
    const mockFormatter = jest.fn((value) => value.toUpperCase());
    const mockOnChange = jest.fn();

    render(
      <TextInput
        formatter={mockFormatter}
        onChange={mockOnChange}
      />,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockFormatter).toHaveBeenCalled();
  });
});

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  test('renders with options', () => {
    render(<Select options={options} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    options.forEach((option) => {
      expect(
        screen.getByRole('option', { name: option.label }),
      ).toBeInTheDocument();
    });
  });

  test('renders placeholder option', () => {
    render(
      <Select
        options={options}
        placeholder="Choose option"
      />,
    );

    expect(
      screen.getByRole('option', { name: 'Choose option' }),
    ).toBeInTheDocument();
  });

  test('handles value and onChange', () => {
    const mockOnChange = jest.fn();

    render(
      <Select
        options={options}
        onChange={mockOnChange}
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option2' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  test('handles disabled state', () => {
    render(
      <Select
        options={options}
        disabled
      />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  test('displays selected value', () => {
    render(
      <Select
        options={options}
        value="option2"
      />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });
});

describe('DateInput Component', () => {
  test('renders date input', () => {
    render(<DateInput />);

    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'date');
  });

  test('handles value and onChange', () => {
    const mockOnChange = jest.fn();

    render(<DateInput onChange={mockOnChange} />);

    const input = screen.getByDisplayValue('');
    fireEvent.change(input, { target: { value: '2023-12-25' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  test('formats ISO date value for input', () => {
    const isoDate = '2023-12-25T00:00:00.000Z';
    render(<DateInput value={isoDate} />);

    const input = screen.getByDisplayValue('2023-12-25');
    expect(input).toBeInTheDocument();
  });

  test('handles min and max attributes', () => {
    render(
      <DateInput
        min="2023-01-01"
        max="2023-12-31"
      />,
    );

    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('min', '2023-01-01');
    expect(input).toHaveAttribute('max', '2023-12-31');
  });

  test('handles disabled state', () => {
    render(<DateInput disabled />);

    const input = screen.getByDisplayValue('');
    expect(input).toBeDisabled();
  });
});

describe('Textarea Component', () => {
  test('renders with default props', () => {
    render(<Textarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
    expect(textarea).toHaveAttribute('rows', '3');
  });

  test('handles value and onChange', () => {
    const mockOnChange = jest.fn();

    render(
      <Textarea
        value="initial text"
        onChange={mockOnChange}
      />,
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('initial text');

    fireEvent.change(textarea, { target: { value: 'initial text more text' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('applies custom rows', () => {
    render(<Textarea rows={5} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  test('handles disabled state', () => {
    render(<Textarea disabled />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  test('shows placeholder text', () => {
    render(<Textarea placeholder="Enter your message" />);

    const textarea = screen.getByPlaceholderText('Enter your message');
    expect(textarea).toBeInTheDocument();
  });
});

describe('Checkbox Component', () => {
  test('renders with label', () => {
    render(<Checkbox label="Test Checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument();
  });

  test('handles checked state and onChange', () => {
    const mockOnChange = jest.fn();

    render(
      <Checkbox
        checked={false}
        onChange={mockOnChange}
        label="Toggle me"
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('renders as checked when checked prop is true', () => {
    render(
      <Checkbox
        checked={true}
        label="Checked"
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('handles disabled state', () => {
    render(
      <Checkbox
        disabled
        label="Disabled checkbox"
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  test('generates unique ID when not provided', () => {
    render(<Checkbox label="Auto ID Checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id');
    expect(checkbox.id).toMatch(/^checkbox-/);
  });

  test('uses provided ID', () => {
    render(
      <Checkbox
        id="custom-id"
        label="Custom ID Checkbox"
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'custom-id');
  });
});

describe('createValidator function', () => {
  beforeEach(() => {
    // Mock window.Validators
    window.Validators = {
      email: jest.fn((message) => (value) => ({
        isValid: value.includes('@'),
        message: message || 'Invalid email',
      })),
      required: jest.fn((message) => (value) => ({
        isValid: !!value,
        message: message || 'Required field',
      })),
    };
  });

  afterEach(() => {
    delete window.Validators;
  });

  test('creates validator when Validators exists', () => {
    const validator = createValidator('email');
    expect(validator).toBeTruthy();
    expect(window.Validators.email).toHaveBeenCalled();
  });

  test('returns null when Validators does not exist', () => {
    delete window.Validators;
    const validator = createValidator('email');
    expect(validator).toBeNull();
  });

  test('passes options to validator', () => {
    createValidator('email', { message: 'Custom error message' });
    expect(window.Validators.email).toHaveBeenCalledWith(
      'Custom error message',
    );
  });
});

describe('Accessibility', () => {
  test('FormField provides proper ARIA attributes', () => {
    render(
      <FormField
        label="Accessible Field"
        error="Error message"
      >
        <input
          type="text"
          data-testid="input"
        />
      </FormField>,
    );

    const input = screen.getByTestId('input');
    const errorElement = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    expect(errorElement).toHaveAttribute('role', 'alert');
  });

  test('Checkbox has proper label association', () => {
    render(<Checkbox label="Accessible Checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Accessible Checkbox');

    expect(checkbox).toHaveAttribute('id');
    expect(label.closest('label')).toHaveAttribute('for', checkbox.id);
  });
});

describe('Error Handling', () => {
  test('handles invalid children gracefully', () => {
    render(
      <FormField label="Field">
        <div>Not an input</div>
      </FormField>,
    );

    expect(screen.getByText('Field')).toBeInTheDocument();
    expect(screen.getByText('Not an input')).toBeInTheDocument();
  });

  test('handles empty options array in Select', () => {
    render(
      <Select
        options={[]}
        placeholder=""
      />,
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children).toHaveLength(0);
  });

  test('handles missing label in options', () => {
    const optionsWithoutLabels = [{ value: 'option1' }, { value: 'option2' }];

    render(<Select options={optionsWithoutLabels} />);

    expect(screen.getByRole('option', { name: 'option1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'option2' })).toBeInTheDocument();
  });
});
