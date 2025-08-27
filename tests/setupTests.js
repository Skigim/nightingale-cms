import '@testing-library/jest-dom';

// Mock global React and ReactDOM for components that use window.React
global.React = require('react');
global.ReactDOM = require('react-dom');

// Setup window object for browser-like environment
Object.defineProperty(window, 'React', {
  writable: true,
  value: global.React,
});

Object.defineProperty(window, 'ReactDOM', {
  writable: true,
  value: global.ReactDOM,
});

// Mock console.warn to not clutter test output
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

// Global test helpers
global.testUtils = {
  // Helper to create mock props for components
  createMockProps: (overrides = {}) => ({
    ...overrides,
  }),

  // Helper to wait for async operations
  waitFor: (callback, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = callback();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime >= timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 10);
          }
        } catch (error) {
          if (Date.now() - startTime >= timeout) {
            reject(error);
          } else {
            setTimeout(check, 10);
          }
        }
      };
      check();
    });
  },
};
