/**
 * Test Environment Setup for Nightingale CMS
 *
 * Configures the testing environment with necessary globals, mocks, and utilities
 * for testing React components and services.
 */

import '@testing-library/jest-dom';

// Mock React and ReactDOM globals (as they're loaded via CDN in the app)
global.React = require('react');
global.ReactDOM = require('react-dom');

// Ensure window object exists
global.window = global.window || {};

// Mock window globals that the components expect
global.window.React = global.React;
global.window.ReactDOM = global.ReactDOM;

// Mock external libraries that are loaded via CDN
global.window.dayjs = jest.fn();
global.window.Fuse = jest.fn();

// Mock Nightingale services that components depend on
global.window.NightingaleLogger = {
  get: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  setupWithFileLogging: jest.fn(),
};

global.window.showToast = jest.fn();

// Mock file operations
global.window.NightingaleFileService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
};

// Mock core utilities
global.window.NightingaleCoreUtilities = {
  sanitize: jest.fn((str) => str),
  formatDate: jest.fn((date) => date),
  formatPhoneNumber: jest.fn((phone) => phone),
  Validators: {
    required: jest.fn(() => () => ({
      isValid: true,
      message: '',
      sanitizedValue: '',
    })),
    email: jest.fn(() => () => ({
      isValid: true,
      message: '',
      sanitizedValue: '',
    })),
  },
};

// Mock search service
global.window.NightingaleSearchService = jest.fn();

// Suppress console warnings in tests unless debugging
global.console.warn = jest.fn();
global.console.error = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock IntersectionObserver for components that might use it
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock ResizeObserver for components that might use it
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
