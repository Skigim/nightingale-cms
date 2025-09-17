import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../src/components/ui/FormComponents.jsx';
import { getComponent } from '../../src/services/registry';

// Simple tests to ensure global format prop works for phone & ssn.

describe('TextInput format prop', () => {
  const TextInput = () => getComponent('ui', 'TextInput');

  test('formats phone number progressively', () => {
    const TI = TextInput();
    const Wrapper = () => {
      const [val, setVal] = React.useState('');
      return (
        <TI
          value={val}
          onChange={(e) => setVal(e.target.value)}
          format="phone"
          aria-label="phone"
        />
      );
    };
    render(<Wrapper />);
    const input = screen.getByLabelText('phone');
    fireEvent.change(input, { target: { value: '402' } });
    expect(input.value).toBe('402');
    fireEvent.change(input, { target: { value: '4025' } });
    expect(input.value).toBe('(402) 5');
    fireEvent.change(input, { target: { value: '4025559999' } });
    expect(input.value).toBe('(402) 555-9999');
  });

  test('formats ssn progressively', () => {
    const TI = TextInput();
    const Wrapper = () => {
      const [val, setVal] = React.useState('');
      return (
        <TI
          value={val}
          onChange={(e) => setVal(e.target.value)}
          format="ssn"
          aria-label="ssn"
        />
      );
    };
    render(<Wrapper />);
    const input = screen.getByLabelText('ssn');
    fireEvent.change(input, { target: { value: '123' } });
    expect(input.value).toBe('123');
    fireEvent.change(input, { target: { value: '1234' } });
    expect(input.value).toBe('123-4');
    fireEvent.change(input, { target: { value: '12345' } });
    expect(input.value).toBe('123-45');
    fireEvent.change(input, { target: { value: '123456789' } });
    expect(input.value).toBe('123-45-6789');
  });
});
