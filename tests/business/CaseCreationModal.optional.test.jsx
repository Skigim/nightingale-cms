/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaseCreationModal from '../../src/components/business/CaseCreationModal.jsx';

// Minimal registry mocks (Modal + StepperModal consumed inside component)
jest.mock('../../src/services/registry', () => {
  const actual = jest.requireActual('../../src/services/registry');
  return {
    ...actual,
    getComponent: (_layer, name) => {
      switch (name) {
        case 'StepperModal':
        case 'Modal':
          return function MockModal({
            isOpen,
            onClose,
            title,
            children,
            onStepChange,
            onComplete,
            steps = [],
            currentStep = 0,
            completeButtonText = 'Complete',
          }) {
            if (!isOpen) return null;
            return (
              <div data-testid="modal">
                <h2>{title}</h2>
                <div data-testid="step-index">{currentStep}</div>
                <div data-testid="steps-count">{steps.length}</div>
                <div>{children}</div>
                <button
                  onClick={() => onStepChange(currentStep + 1)}
                  disabled={currentStep >= steps.length - 1}
                >
                  Next
                </button>
                <button onClick={onComplete}>{completeButtonText}</button>
                <button onClick={onClose}>Close</button>
              </div>
            );
          };
        case 'FormField':
          return function MockFormField({ children }) {
            return <div className="form-field-mock">{children}</div>;
          };
        case 'TextInput':
          return function MockTextInput(props) {
            return (
              <input
                data-testid="text-input"
                {...props}
              />
            );
          };
        case 'Select':
          return function MockSelect({ options = [], ...rest }) {
            return (
              <select
                data-testid="select"
                {...rest}
              >
                {options.map((o) => (
                  <option
                    key={o.value}
                    value={o.value}
                  >
                    {o.label}
                  </option>
                ))}
              </select>
            );
          };
        case 'DateInput':
          return function MockDateInput(props) {
            return (
              <input
                type="date"
                data-testid="date-input"
                {...props}
              />
            );
          };
        case 'SearchBar':
          return function MockSearchBar({ value = '', onChange }) {
            return (
              <div>
                <input
                  data-testid="search-input"
                  value={value}
                  onChange={onChange || (() => {})}
                />
              </div>
            );
          };
        default:
          return null;
      }
    },
    registerComponent: () => {},
  };
});

describe('CaseCreationModal (requireFields = false)', () => {
  const baseProps = {
    isOpen: true,
    onClose: jest.fn(),
    onCaseCreated: jest.fn(),
    fullData: { cases: [], people: [], organizations: [] },
    fileService: {
      checkPermission: jest.fn().mockResolvedValue('granted'),
      readFile: jest
        .fn()
        .mockResolvedValue({ cases: [], people: [], organizations: [] }),
      writeFile: jest.fn().mockResolvedValue(true),
    },
  };

  test('freely navigates forward without validation gating when requireFields is false', () => {
    render(
      <CaseCreationModal
        {...baseProps}
        requireFields={false}
      />,
    );

    expect(screen.getByTestId('step-index')).toHaveTextContent('0');

    const stepsCount = parseInt(
      screen.getByTestId('steps-count').textContent,
      10,
    );

    // Click Next until final step reached, re-querying button each render
    let safety = 10;
    while (
      parseInt(screen.getByTestId('step-index').textContent, 10) <
        stepsCount - 1 &&
      safety-- > 0
    ) {
      const btn = screen.getByText('Next');
      fireEvent.click(btn);
    }

    const finalIndex = parseInt(
      screen.getByTestId('step-index').textContent,
      10,
    );
    expect(finalIndex).toBe(stepsCount - 1);
  });
});
