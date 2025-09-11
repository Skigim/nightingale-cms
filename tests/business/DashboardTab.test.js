/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Provide global React for legacy components using window.React internally
window.React = React;

// Toast stub
window.NightingaleToast = {
  showInfoToast: jest.fn(),
};

// Import component AFTER globals
import DashboardTab from '../../src/components/business/DashboardTab.jsx';

function createFullData() {
  return {
    cases: [
      { id: 'c1', status: 'Pending' },
      { id: 'c2', status: 'Closed' },
      { id: 'c3', status: 'Denied' },
      { id: 'c4', status: 'Approved' },
    ],
    vrRequests: [
      { id: 'vr1', status: 'Pending' },
      { id: 'vr2', status: 'Completed' },
      { id: 'vr3', status: 'Completed' },
    ],
  };
}

describe('DashboardTab', () => {
  test('renders statistics with provided data', () => {
    render(<DashboardTab fullData={createFullData()} />);
    // Headings
    expect(
      screen.getByRole('heading', { name: /Welcome to Nightingale CMS/i }),
    ).toBeInTheDocument();
    // Stat labels
    ['Total Cases', 'Active Cases', 'VR Requests', 'Pending VRs'].forEach((l) =>
      expect(screen.getByText(l)).toBeInTheDocument(),
    );
    // Values (distinct)
    expect(screen.getByText('4')).toBeInTheDocument(); // total cases
    expect(screen.getByText('2')).toBeInTheDocument(); // active cases (Pending + Approved)
    expect(screen.getByText('3')).toBeInTheDocument(); // total VR requests
    expect(screen.getByText('1')).toBeInTheDocument(); // pending VRs
  });

  test('renders zero stats gracefully when no data', () => {
    render(<DashboardTab fullData={null} />);
    ['0'].forEach((num) =>
      expect(screen.getAllByText(num).length).toBeGreaterThan(0),
    );
  });

  test('quick action: create case triggers toast', () => {
    render(<DashboardTab fullData={createFullData()} />);
    const btn = screen.getByRole('button', { name: /Create New Case/i });
    fireEvent.click(btn);
    expect(window.NightingaleToast.showInfoToast).toHaveBeenCalledWith(
      'Case creation coming soon!',
    );
  });

  test('quick action: search cases updates hash', () => {
    const originalHash = window.location.hash;
    render(<DashboardTab fullData={createFullData()} />);
    const btn = screen.getByRole('button', { name: /Search Cases/i });
    fireEvent.click(btn);
    expect(window.location.hash).toBe('#cases');
    // restore
    window.location.hash = originalHash;
  });
});
