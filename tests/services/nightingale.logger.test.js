/**
 * @jest-environment node
 */

/**
 * Tests for Nightingale Logger Service
 * Core functionality tests for the structured logging system
 */

import NightingaleLogger, {
  LEVELS,
  LEVEL_WEIGHT,
  createSessionEnricher,
  createPerformanceEnricher,
  createMemoryTransport,
} from '../../src/services/nightingale.logger.js';

describe('NightingaleLogger', () => {
  describe('Constants and Configuration', () => {
    test('should export level constants', () => {
      expect(LEVELS).toBeDefined();
      expect(Array.isArray(LEVELS)).toBe(true);
      expect(LEVELS).toContain('info');
      expect(LEVELS).toContain('error');
      expect(LEVELS).toContain('debug');
      expect(LEVELS).toContain('warn');
      expect(LEVELS).toContain('trace');
      expect(LEVELS).toContain('silent');
    });

    test('should export level weights', () => {
      expect(LEVEL_WEIGHT).toBeDefined();
      expect(typeof LEVEL_WEIGHT).toBe('object');
      expect(LEVEL_WEIGHT.error).toBeGreaterThan(LEVEL_WEIGHT.warn);
      expect(LEVEL_WEIGHT.warn).toBeGreaterThan(LEVEL_WEIGHT.info);
      expect(LEVEL_WEIGHT.info).toBeGreaterThan(LEVEL_WEIGHT.debug);
      expect(LEVEL_WEIGHT.debug).toBeGreaterThan(LEVEL_WEIGHT.trace);
    });
  });

  describe('Logger Instance', () => {
    test('should create logger service', () => {
      expect(NightingaleLogger).toBeDefined();
      expect(typeof NightingaleLogger).toBe('object');
      expect(typeof NightingaleLogger.get).toBe('function');
      expect(typeof NightingaleLogger.configure).toBe('function');
    });

    test('should have version and name', () => {
      expect(NightingaleLogger.version).toBeDefined();
      expect(NightingaleLogger.name).toBe('NightingaleLogger');
    });

    test('should create namespaced logger', () => {
      const logger = NightingaleLogger.get('test');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.trace).toBe('function');
    });

    test('should create child logger', () => {
      const logger = NightingaleLogger.get('parent');
      const childLogger = logger.child('child');
      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
    });
  });

  describe('Configuration', () => {
    let originalConfig;

    beforeEach(() => {
      originalConfig = NightingaleLogger.getConfig();
    });

    afterEach(() => {
      NightingaleLogger.configure(originalConfig);
    });

    test('should get current configuration', () => {
      const config = NightingaleLogger.getConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
      expect(config.level).toBeDefined();
      expect(config.buffered).toBeDefined();
    });

    test('should configure logger settings', () => {
      const newConfig = { level: 'debug', buffered: false };
      const result = NightingaleLogger.configure(newConfig);

      expect(result.level).toBe('debug');
      expect(result.buffered).toBe(false);
    });

    test('should validate level configuration', () => {
      const result = NightingaleLogger.configure({ level: 'invalid' });
      expect(result.level).toBe('info'); // Should default to info
    });

    test('should handle invalid configuration gracefully', () => {
      expect(() => NightingaleLogger.configure(null)).not.toThrow();
      expect(() => NightingaleLogger.configure('invalid')).not.toThrow();
    });
  });

  describe('Transport Management', () => {
    let originalConfig;

    beforeEach(() => {
      originalConfig = NightingaleLogger.getConfig();
      NightingaleLogger.configure({ transports: [] }); // Reset transports
    });

    afterEach(() => {
      NightingaleLogger.configure(originalConfig);
    });

    test('should add transport', () => {
      const mockTransport = {
        id: 'mock',
        write: jest.fn(),
      };

      const result = NightingaleLogger.addTransport(mockTransport);
      expect(result).toBe(true);

      const config = NightingaleLogger.getConfig();
      expect(config.transports.length).toBeGreaterThan(0);
      expect(config.transports.some((t) => t.id === 'mock')).toBe(true);
    });

    test('should reject invalid transport', () => {
      const result = NightingaleLogger.addTransport({ id: 'invalid' });
      expect(result).toBe(false);
    });

    test('should remove transport by id', () => {
      const mockTransport = {
        id: 'mock',
        write: jest.fn(),
      };

      NightingaleLogger.addTransport(mockTransport);
      const result = NightingaleLogger.removeTransport('mock');
      expect(result).toBe(true);

      const config = NightingaleLogger.getConfig();
      expect(config.transports).not.toContain(mockTransport);
    });
  });

  describe('Enricher Management', () => {
    let originalConfig;

    beforeEach(() => {
      originalConfig = NightingaleLogger.getConfig();
      NightingaleLogger.clearEnrichers();
    });

    afterEach(() => {
      NightingaleLogger.configure(originalConfig);
    });

    test('should add enricher function', () => {
      const mockEnricher = jest.fn();
      const result = NightingaleLogger.addEnricher(mockEnricher);
      expect(result).toBe(true);

      const config = NightingaleLogger.getConfig();
      expect(config.enrichers.length).toBeGreaterThan(0);
      // Enricher may be cloned, so just check we have one
      expect(config.enrichers.length).toBe(1);
    });

    test('should reject invalid enricher', () => {
      const result = NightingaleLogger.addEnricher('not-a-function');
      expect(result).toBe(false);
    });

    test('should clear all enrichers', () => {
      NightingaleLogger.addEnricher(jest.fn());
      NightingaleLogger.clearEnrichers();

      const config = NightingaleLogger.getConfig();
      expect(config.enrichers).toEqual([]);
    });
  });

  describe('Built-in Factories', () => {
    test('should provide transport factories', () => {
      expect(NightingaleLogger.transports).toBeDefined();
      expect(typeof NightingaleLogger.transports.console).toBe('function');
      expect(typeof NightingaleLogger.transports.memory).toBe('function');
      expect(typeof NightingaleLogger.transports.file).toBe('function');
    });

    test('should provide enricher factories', () => {
      expect(NightingaleLogger.enrichers).toBeDefined();
      expect(typeof NightingaleLogger.enrichers.session).toBe('function');
      expect(typeof NightingaleLogger.enrichers.performance).toBe('function');
      expect(typeof NightingaleLogger.enrichers.context).toBe('function');
    });

    test('should create memory transport', () => {
      const transport = createMemoryTransport(100);
      expect(transport).toBeDefined();
      expect(transport.id).toBe('memory');
      expect(typeof transport.write).toBe('function');
      expect(typeof transport.getEntries).toBe('function');
      expect(transport.maxEntries).toBe(100);
    });
  });

  describe('Convenience Setup Methods', () => {
    let originalConfig;

    beforeEach(() => {
      originalConfig = NightingaleLogger.getConfig();
    });

    afterEach(() => {
      NightingaleLogger.configure(originalConfig);
    });

    test('should setup basic configuration', () => {
      const result = NightingaleLogger.setupBasic(false); // Don't enable console in tests
      expect(result).toBe(NightingaleLogger);

      const config = NightingaleLogger.getConfig();
      expect(config.transports.length).toBeGreaterThan(0);
      expect(config.enrichers.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    test('should provide buffer snapshot', () => {
      const snapshot = NightingaleLogger.snapshotBuffer();
      expect(Array.isArray(snapshot)).toBe(true);
    });

    test('should export logs', () => {
      const exported = NightingaleLogger.exportLogs();
      expect(exported).toBeDefined();
    });

    test('should flush buffer', () => {
      expect(() => NightingaleLogger.flush()).not.toThrow();
    });
  });

  describe('Enricher Functions', () => {
    test('should create session enricher', () => {
      const enricher = createSessionEnricher();
      expect(typeof enricher).toBe('function');

      const entry = { meta: {} };
      enricher(entry);
      expect(entry.meta.sessionId).toBeDefined();
      expect(typeof entry.meta.sessionId).toBe('string');
    });

    test('should create performance enricher', () => {
      const enricher = createPerformanceEnricher();
      expect(typeof enricher).toBe('function');

      const entry = { meta: {} };
      enricher(entry);
      expect(entry.meta).toBeDefined();
    });
  });

  describe('Logging Operations', () => {
    let originalConfig;
    let mockTransport;

    beforeEach(() => {
      originalConfig = NightingaleLogger.getConfig();
      mockTransport = {
        id: 'test',
        write: jest.fn(),
      };
      NightingaleLogger.configure({ transports: [], buffered: false });
      NightingaleLogger.addTransport(mockTransport);
    });

    afterEach(() => {
      NightingaleLogger.configure(originalConfig);
    });

    test('should log messages at different levels', () => {
      const logger = NightingaleLogger.get('test');

      logger.info('Test info message');
      logger.warn('Test warn message');
      logger.error('Test error message');

      expect(mockTransport.write).toHaveBeenCalledTimes(3);
    });

    test('should respect log level filtering', () => {
      NightingaleLogger.configure({ level: 'error' });
      const logger = NightingaleLogger.get('test');

      logger.debug('This should be filtered');
      logger.info('This should be filtered');
      logger.error('This should pass');

      expect(mockTransport.write).toHaveBeenCalledTimes(1);
    });
  });
});
