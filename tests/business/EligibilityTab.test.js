import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EligibilityTab from '../../src/components/business/EligibilityTab.jsx';

// Mock registry for clean test
jest.mock('../../src/services/registry', () => ({
  registerComponent: jest.fn(),
}));

describe('EligibilityTab', () => {
  test('renders without crashing', () => {
    render(<EligibilityTab />);
  });

  test('displays expected heading and placeholder text', () => {
    const { getByText } = render(<EligibilityTab />);

    expect(getByText('Eligibility Management')).toBeInTheDocument();
    expect(
      getByText('Eligibility functionality will be implemented here...'),
    ).toBeInTheDocument();
  });

  test('renders with proper structure and styling classes', () => {
    const { container } = render(<EligibilityTab />);

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('space-y-6');

    const heading = container.querySelector('h2');
    expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-white');

    const contentDiv = container.querySelector('.bg-gray-800');
    expect(contentDiv).toHaveClass(
      'rounded-lg',
      'p-6',
      'border',
      'border-gray-700',
    );
  });

  test('accepts fullData prop without error', () => {
    const fullData = { test: 'data' };
    render(<EligibilityTab fullData={fullData} />);
    // No assertions needed - just ensuring no crash with prop
  });
});
