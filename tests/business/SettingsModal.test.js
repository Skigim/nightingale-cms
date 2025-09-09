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
import SettingsModal from '../../src/components/business/SettingsModal.js';

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
});
