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

  test('accepts fullData prop without error', () => {
    const fullData = { test: 'data' };
    render(<EligibilityTab fullData={fullData} />);
    // No assertions needed - just ensuring no crash with prop
  });
});
