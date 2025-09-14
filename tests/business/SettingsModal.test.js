/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Provide global React
window.React = React;

// Global toast stub
window.showToast = jest.fn();

// Import Modal first so it registers in the UI registry
import '../../src/components/ui/Modal.jsx';
import SettingsModal from '../../src/components/business/SettingsModal.jsx';

function createFileService({
  connectResult = true,
  readData = { cases: [], vrRequests: [] },
} = {}) {
  return {
    connect: jest.fn().mockResolvedValue(connectResult),
    readFile: jest.fn().mockResolvedValue(readData),
    writeFile: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SettingsModal', () => {
  test('does not render when closed', () => {
    render(
      <SettingsModal
        isOpen={false}
        onClose={jest.fn()}
        fileStatus="disconnected"
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders core sections when open', () => {
    render(
      <SettingsModal
        isOpen
        onClose={jest.fn()}
        fileStatus="disconnected"
      />,
    );
    // Use getAllByRole to avoid ambiguity (modal title contains Data Management substring)
    const headings = screen.getAllByRole('heading');
    expect(
      headings.some((h) => /File System Connection/i.test(h.textContent)),
    ).toBe(true);
    expect(headings.some((h) => /^Data Management$/i.test(h.textContent))).toBe(
      true,
    );
    expect(
      headings.some((h) => /Settings & Data Management/i.test(h.textContent)),
    ).toBe(true);
  });

  test('connect button invokes fileService.connect and status callback', async () => {
    const fileService = createFileService();
    const onFileStatusChange = jest.fn();
    render(
      <SettingsModal
        isOpen
        onClose={jest.fn()}
        fileService={fileService}
        fileStatus="disconnected"
        onFileStatusChange={onFileStatusChange}
      />,
    );
    const btn = screen.getByRole('button', { name: /Connect to Directory/i });
    fireEvent.click(btn);
    await waitFor(() => expect(fileService.connect).toHaveBeenCalled());
    expect(onFileStatusChange).toHaveBeenCalledWith('connected');
    expect(window.showToast).toHaveBeenCalledWith(
      'Directory connected successfully!',
      'success',
    );
  });

  test('load data button reads file and triggers callbacks', async () => {
    const fileService = createFileService({
      readData: { cases: [{ id: 'c1' }] },
    });
    const onDataLoaded = jest.fn();
    const onClose = jest.fn();
    render(
      <SettingsModal
        isOpen
        onClose={onClose}
        fileService={fileService}
        onDataLoaded={onDataLoaded}
        fileStatus="connected"
      />,
    );
    const btn = screen.getByRole('button', { name: /Load Data File/i });
    fireEvent.click(btn);
    await waitFor(() => expect(fileService.readFile).toHaveBeenCalled());
    expect(onDataLoaded).toHaveBeenCalledWith({ cases: [{ id: 'c1' }] });
    expect(window.showToast).toHaveBeenCalledWith(
      'Data loaded successfully! Found 1 cases',
      'success',
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('create sample data writes file and closes', async () => {
    const fileService = createFileService();
    const onDataLoaded = jest.fn();
    const onClose = jest.fn();
    render(
      <SettingsModal
        isOpen
        onClose={onClose}
        fileService={fileService}
        onDataLoaded={onDataLoaded}
        fileStatus="connected"
      />,
    );
    const btn = screen.getByRole('button', { name: /Create Sample Data/i });
    fireEvent.click(btn);
    await waitFor(() => expect(fileService.writeFile).toHaveBeenCalled());
    expect(onDataLoaded).toHaveBeenCalled();
    expect(window.showToast).toHaveBeenCalledWith(
      'Sample data created and loaded!',
      'success',
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('demo mode switch enables embedded dataset (disconnected)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        people: [{ id: 'p1', name: 'User' }],
        cases: [],
        meta: { source: 'embedded-sample' },
      }),
    });
    const onDataLoaded = jest.fn();
    render(
      <SettingsModal
        isOpen
        onClose={jest.fn()}
        onDataLoaded={onDataLoaded}
        fileStatus="disconnected"
      />,
    );
    const checkbox = screen.getByRole('checkbox', {
      name: /toggle demo mode/i,
    });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    await waitFor(() => expect(onDataLoaded).toHaveBeenCalled());
    const stored = JSON.parse(localStorage.getItem('nightingale_data'));
    expect(stored.meta.source).toBe('embedded-sample');
    expect(window.showToast).toHaveBeenCalledWith(
      'Demo mode enabled (embedded sample)',
      'success',
    );
  });

  test('demo mode disabling while disconnected clears localStorage and data', async () => {
    // Seed demo mode first
    localStorage.setItem(
      'nightingale_data',
      JSON.stringify({ meta: { source: 'embedded-sample' }, people: [] }),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        people: [],
        meta: { source: 'embedded-sample' },
      }),
    });
    const onDataLoaded = jest.fn();
    render(
      <SettingsModal
        isOpen
        onClose={jest.fn()}
        onDataLoaded={onDataLoaded}
        fileStatus="disconnected"
      />,
    );
    // Switch should start in checked state due to seeded localStorage detection
    const checkbox = screen.getByRole('checkbox', {
      name: /toggle demo mode/i,
    });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox); // disable
    await waitFor(() =>
      expect(window.showToast).toHaveBeenCalledWith(
        'Demo mode disabled',
        'info',
      ),
    );
    expect(localStorage.getItem('nightingale_data')).toBeNull();
  });

  test('demo mode disabling while connected reloads file data', async () => {
    // Seed demo mode first
    localStorage.setItem(
      'nightingale_data',
      JSON.stringify({ meta: { source: 'embedded-sample' }, people: [] }),
    );
    const fileService = createFileService({
      readData: { cases: [{ id: 'live' }] },
    });
    const onDataLoaded = jest.fn();
    render(
      <SettingsModal
        isOpen
        onClose={jest.fn()}
        onDataLoaded={onDataLoaded}
        fileService={fileService}
        fileStatus="connected"
      />,
    );
    const checkbox = screen.getByRole('checkbox', {
      name: /toggle demo mode/i,
    });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox); // disable
    await waitFor(() =>
      expect(window.showToast).toHaveBeenCalledWith(
        'Demo mode disabled',
        'info',
      ),
    );
    // After disable, should have attempted to reload file data
    expect(fileService.readFile).toHaveBeenCalled();
    // onDataLoaded called with live data at some point
    const calls = onDataLoaded.mock.calls.map((c) => c[0]);
    expect(
      calls.some((arg) => arg && arg.cases && arg.cases[0].id === 'live'),
    ).toBe(true);
  });

  test('loading data file clears embedded localStorage sample', async () => {
    // Seed localStorage with embedded sample
    localStorage.setItem(
      'nightingale_data',
      JSON.stringify({ people: [{ id: 'pX' }] }),
    );
    const fileService = createFileService({
      readData: { cases: [{ id: 'cLive' }], people: [{ id: 'pLive' }] },
    });
    const onDataLoaded = jest.fn();
    const onClose = jest.fn();
    render(
      <SettingsModal
        isOpen
        onClose={onClose}
        fileService={fileService}
        onDataLoaded={onDataLoaded}
        fileStatus="connected"
      />,
    );
    const btn = screen.getByRole('button', { name: /Load Data File/i });
    fireEvent.click(btn);
    await waitFor(() => expect(fileService.readFile).toHaveBeenCalled());
    expect(localStorage.getItem('nightingale_data')).toBeNull();
  });
});
