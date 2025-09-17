/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonCreationModal from '../../src/components/business/PersonCreationModal.jsx';

jest.mock('../../src/services/registry', () => {
  const actual = jest.requireActual('../../src/services/registry');
  return {
    ...actual,
    getComponent: (layer, name) => {
      if (name === 'StepperModal' || name === 'Modal') {
        return function MockModal({
          isOpen,
          title,
          children,
          onStepChange,
          steps = [],
          currentStep = 0,
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
            </div>
          );
        };
      }
      return null;
    },
    registerComponent: () => {},
  };
});

describe('PersonCreationModal (requireFields = false)', () => {
  const baseProps = {
    isOpen: true,
    onClose: jest.fn(),
    onPersonCreated: jest.fn(),
    fullData: { people: [] },
    fileService: {
      checkPermission: jest.fn().mockResolvedValue('granted'),
      readFile: jest.fn().mockResolvedValue({ people: [] }),
      writeFile: jest.fn().mockResolvedValue(true),
    },
  };

  test('advances steps without required field entries when requireFields is false', () => {
    render(
      <PersonCreationModal
        {...baseProps}
        requireFields={false}
      />,
    );

    expect(screen.getByTestId('step-index')).toHaveTextContent('0');
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('step-index')).toHaveTextContent('1');
  });
});
