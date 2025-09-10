/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import PersonDetailsView from '../../src/components/business/PersonDetailsView.jsx';

// Ensure global React for project pattern
window.React = React;

const people = [
  {
    id: 'p1',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '555-1234',
  },
];

afterEach(() => cleanup());

describe('PersonDetailsView (MUI)', () => {
  test('should display person details when a valid personId is provided', () => {
    const onBackToList = jest.fn();
    render(
      <PersonDetailsView
        personId="p1"
        fullData={{ people, cases: [] }}
        onBackToList={onBackToList}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Jane Doe' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/jane.doe@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/555-1234/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Back to List/i }),
    ).toBeInTheDocument();
  });

  test("should display 'Person not found' when an invalid personId is provided", () => {
    const onBackToList = jest.fn();
    render(
      <PersonDetailsView
        personId="missing"
        fullData={{ people, cases: [] }}
        onBackToList={onBackToList}
      />,
    );
    expect(screen.getByText('Person not found')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Back to People/i }),
    ).toBeInTheDocument();
  });
});
