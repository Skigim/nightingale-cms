import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BugReportModal from '../../src/components/business/BugReportModal.jsx';

describe('BugReportModal', () => {
  it('submits report including diagnostics by default', async () => {
    const onSubmit = jest.fn();

    render(
      <BugReportModal
        isOpen
        onClose={() => {}}
        onSubmit={onSubmit}
        activeTab="Dashboard"
      />,
    );

    const textarea = screen.getByPlaceholderText(/Describe the problem/i);
    fireEvent.change(textarea, {
      target: { value: 'Minor UI issue with layout' },
    });
    const submitBtn = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.content).toMatch(/minor ui issue/i);
    expect(payload.activeTab).toBe('Dashboard');
    expect(payload.diagnostics).toBeDefined();
  });

  it('omits diagnostics when checkbox unchecked', async () => {
    const onSubmit = jest.fn();

    render(
      <BugReportModal
        isOpen
        onClose={() => {}}
        onSubmit={onSubmit}
        activeTab="Settings"
        includeDiagnostics
      />,
    );

    const textarea = screen.getByPlaceholderText(/Describe the problem/i);
    fireEvent.change(textarea, {
      target: { value: 'Crash after clicking save' },
    });

    // Uncheck diagnostics box
    const checkbox = screen.getByRole('checkbox', {
      name: /Include diagnostics/i,
    });
    fireEvent.click(checkbox); // now unchecked

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.content).toMatch(/crash after clicking save/i);
    expect(payload.diagnostics).toBeUndefined();
  });
});
