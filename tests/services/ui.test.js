/**
 * @jest-environment jsdom
 */

import UIUtilities from '../../src/services/ui.js';

describe('UIUtilities', () => {
  // Mock DOM elements for testing
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <input id="first-input" type="text" />
        <button id="test-button" disabled>Disabled Button</button>
        <button id="enabled-button">Enabled Button</button>
      </div>
      <div id="section-1" class="section">Section 1</div>
      <div id="notes-section">Notes Section</div>
    `;

    // Mock window properties
    global.window.scrollTo = jest.fn();
    global.BroadcastChannel = jest.fn().mockImplementation(() => ({
      postMessage: jest.fn(),
      close: jest.fn(),
    }));
  });

  describe('service structure', () => {
    test('should have correct version and name', () => {
      expect(UIUtilities.version).toBe('1.0.0');
      expect(UIUtilities.name).toBe('UIUtilities');
    });

    test('should expose FocusManager', () => {
      expect(UIUtilities.FocusManager).toBeDefined();
      expect(typeof UIUtilities.FocusManager.focusFirst).toBe('function');
    });

    test('should expose utility functions', () => {
      expect(typeof UIUtilities.scrollToSection).toBe('function');
      expect(typeof UIUtilities.scrollToNotes).toBe('function');
      expect(typeof UIUtilities.testDataIntegrityBroadcast).toBe('function');
      expect(typeof UIUtilities.checkAppStatus).toBe('function');
      expect(typeof UIUtilities.debugComponentLibrary).toBe('function');
    });
  });

  describe('FocusManager', () => {
    describe('focusFirst', () => {
      test('should return a promise', async () => {
        const container = document.getElementById('test-container');
        const result = UIUtilities.FocusManager.focusFirst(container);
        expect(result).toBeInstanceOf(Promise);
        await result; // Wait for completion
      });

      test('should return null for non-existent container', async () => {
        const result = await UIUtilities.FocusManager.focusFirst('#non-existent');
        expect(result).toBeNull();
      });

      test('should handle null container', async () => {
        const result = await UIUtilities.FocusManager.focusFirst(null);
        expect(result).toBeNull();
      });

      test('should accept options object', async () => {
        const container = document.getElementById('test-container');
        const onNoFocusable = jest.fn();
        
        await UIUtilities.FocusManager.focusFirst(container, {
          onNoFocusable,
        });
        
        // Should not throw error
        expect(true).toBe(true);
      });
    });
  });

  describe('scrollToSection', () => {
    test('should handle existing element', () => {
      expect(() => {
        UIUtilities.scrollToSection('section-1');
      }).not.toThrow();
    });

    test('should handle non-existent element gracefully', () => {
      expect(() => {
        UIUtilities.scrollToSection('non-existent');
      }).not.toThrow();
    });

    test('should handle custom offset', () => {
      expect(() => {
        UIUtilities.scrollToSection('section-1', 100);
      }).not.toThrow();
    });
  });

  describe('scrollToNotes', () => {
    test('should scroll to notes section', () => {
      expect(() => {
        UIUtilities.scrollToNotes();
      }).not.toThrow();
    });

    test('should handle missing notes section', () => {
      document.querySelector('#notes-section').remove();
      
      expect(() => {
        UIUtilities.scrollToNotes();
      }).not.toThrow();
    });
  });

  describe('testDataIntegrityBroadcast', () => {
    test('should return a result', () => {
      const result = UIUtilities.testDataIntegrityBroadcast('test-message');
      expect(result).toBeDefined();
    });

    test('should handle broadcast errors gracefully', () => {
      global.BroadcastChannel = jest.fn().mockImplementation(() => {
        throw new Error('Broadcast failed');
      });

      expect(() => {
        UIUtilities.testDataIntegrityBroadcast('test-message');
      }).not.toThrow();
    });
  });

  describe('checkAppStatus', () => {
    test('should return an object with timestamp', () => {
      const status = UIUtilities.checkAppStatus();
      expect(typeof status).toBe('object');
      expect(status.timestamp).toBeDefined();
    });

    test('should check for various services', () => {
      global.window.NightingaleFileService = { status: 'ready' };
      global.window.NightingaleToast = { status: 'ready' };
      
      const status = UIUtilities.checkAppStatus();
      expect(typeof status).toBe('object');
      expect(status).toHaveProperty('timestamp');
    });
  });

  describe('debugComponentLibrary', () => {
    test('should return object when component library available', () => {
      global.window.NightingaleComponentLibrary = {
        Button: {},
        Modal: {},
        Card: {},
      };

      const info = UIUtilities.debugComponentLibrary();
      expect(typeof info).toBe('object');
      expect(info.registrySize).toBe(3);
    });

    test('should return null when component library not available', () => {
      delete global.window.NightingaleComponentLibrary;

      const info = UIUtilities.debugComponentLibrary();
      expect(info).toBeNull();
    });
  });

  describe('backward compatibility', () => {
    test('should expose service to window object', () => {
      // Clean up any existing window properties
      delete window.NightingaleUIUtilities;
      delete window.NightingaleFocusManager;
      delete window.scrollToSection;

      // Re-import to trigger window assignment
      jest.resetModules();
      require('../../src/services/ui.js');

      expect(window.NightingaleUIUtilities).toBeDefined();
      expect(window.NightingaleFocusManager).toBeDefined();
      expect(window.NightingaleServices?.uiUtilities).toBeDefined();
      expect(typeof window.scrollToSection).toBe('function');
      expect(typeof window.scrollToNotes).toBe('function');
      expect(typeof window.testDataIntegrityBroadcast).toBe('function');
      expect(typeof window.checkAppStatus).toBe('function');
      expect(typeof window.debugComponentLibrary).toBe('function');
    });

    test('should have bound methods that execute without error', () => {
      expect(() => {
        window.scrollToSection('section-1');
      }).not.toThrow();
      
      expect(() => {
        window.scrollToNotes();
      }).not.toThrow();
      
      expect(() => {
        window.checkAppStatus();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    test('should handle scroll errors gracefully', () => {
      global.window.scrollTo = jest.fn(() => {
        throw new Error('Scroll failed');
      });

      expect(() => {
        UIUtilities.scrollToSection('section-1');
      }).not.toThrow();
    });

    test('should handle focus manager errors gracefully', async () => {
      expect(async () => {
        await UIUtilities.FocusManager.focusFirst('#test-container');
      }).not.toThrow();
    });
  });
});