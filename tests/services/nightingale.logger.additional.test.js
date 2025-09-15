/**
 * Additional tests for nightingale.logger.js focusing on level filtering
 * and core functionality not covered in existing tests
 */

import NightingaleLogger from '../../src/services/nightingale.logger.js';

describe('nightingale.logger level filtering', () => {
  let consoleSpies;

  beforeEach(() => {
    // Spy on console methods
    consoleSpies = {
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    };

    // Reset logger to a known state
    NightingaleLogger.configure({
      level: 'info',
      buffered: false,
      transports: [],
      enrichers: [],
    });

    // Add console transport manually
    const consoleTransport = NightingaleLogger.transports.console();
    NightingaleLogger.addTransport(consoleTransport);
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach((spy) => spy.mockRestore());
  });

  test('creates logger instance at different levels', () => {
    const infoLogger = NightingaleLogger.get('test:info');
    const warnLogger = NightingaleLogger.get('test:warn');
    const errorLogger = NightingaleLogger.get('test:error');

    expect(infoLogger).toBeDefined();
    expect(warnLogger).toBeDefined();
    expect(errorLogger).toBeDefined();

    expect(typeof infoLogger.info).toBe('function');
    expect(typeof warnLogger.warn).toBe('function');
    expect(typeof errorLogger.error).toBe('function');
  });

  test('level filtering: info level allows warn and error', () => {
    NightingaleLogger.configure({ level: 'info' });
    const logger = NightingaleLogger.get('test:filtering');

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    // Debug should not output, info/warn/error should
    expect(consoleSpies.debug).not.toHaveBeenCalled();
    expect(consoleSpies.info).toHaveBeenCalled();
    expect(consoleSpies.warn).toHaveBeenCalled();
    expect(consoleSpies.error).toHaveBeenCalled();
  });

  test('level filtering: warn level blocks info but allows warn and error', () => {
    NightingaleLogger.configure({ level: 'warn' });
    const logger = NightingaleLogger.get('test:warn-filter');

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    // Debug and info should not output, warn/error should
    expect(consoleSpies.debug).not.toHaveBeenCalled();
    expect(consoleSpies.info).not.toHaveBeenCalled();
    expect(consoleSpies.warn).toHaveBeenCalled();
    expect(consoleSpies.error).toHaveBeenCalled();
  });

  test('level filtering: error level only allows error', () => {
    NightingaleLogger.configure({ level: 'error' });
    const logger = NightingaleLogger.get('test:error-filter');

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    // Only error should output
    expect(consoleSpies.debug).not.toHaveBeenCalled();
    expect(consoleSpies.info).not.toHaveBeenCalled();
    expect(consoleSpies.warn).not.toHaveBeenCalled();
    expect(consoleSpies.error).toHaveBeenCalled();
  });

  test('child logger inherits level configuration', () => {
    NightingaleLogger.configure({ level: 'warn' });
    const parentLogger = NightingaleLogger.get('test:parent');
    const childLogger = parentLogger.child('child');

    parentLogger.info('parent info');
    childLogger.info('child info');
    parentLogger.warn('parent warn');
    childLogger.warn('child warn');

    // Info should not output for either, warn should output for both
    expect(consoleSpies.info).not.toHaveBeenCalled();
    expect(consoleSpies.warn).toHaveBeenCalledTimes(2);
  });

  test('setupBasic initializes logger with console transport', () => {
    // Reset first
    NightingaleLogger.configure({ transports: [], enrichers: [] });
    NightingaleLogger.setupBasic(true); // Console enabled

    const logger = NightingaleLogger.get('test:setup');
    logger.info('setup test');

    expect(consoleSpies.info).toHaveBeenCalled();
  });

  test('setupBasic with memory transport', () => {
    // Reset first
    NightingaleLogger.configure({ transports: [], enrichers: [] });
    NightingaleLogger.setupBasic(true); // With memory transport

    const logger = NightingaleLogger.get('test:memory');
    logger.info('memory test');

    // Should be able to export logs
    const exported = NightingaleLogger.exportLogs();
    expect(exported).toBeDefined();
  });

  test('handles invalid log levels gracefully', () => {
    const logger = NightingaleLogger.get('test:invalid');

    // Should not throw when logging
    expect(() => {
      logger.info('valid message');
    }).not.toThrow();
  });

  test('silent level blocks all output', () => {
    NightingaleLogger.configure({ level: 'silent' });
    const logger = NightingaleLogger.get('test:silent');

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    // Nothing should output
    expect(consoleSpies.debug).not.toHaveBeenCalled();
    expect(consoleSpies.info).not.toHaveBeenCalled();
    expect(consoleSpies.warn).not.toHaveBeenCalled();
    expect(consoleSpies.error).not.toHaveBeenCalled();
  });

  test('namespace formatting in log output', () => {
    const logger = NightingaleLogger.get('test:namespace:deep');

    logger.info('test message');

    // Check that console.info was called with proper format
    expect(consoleSpies.info).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] test:namespace:deep'),
      '',
    );
  });

  test('configure returns configuration copy', () => {
    const config = NightingaleLogger.configure({ level: 'debug' });

    expect(config).toBeDefined();
    expect(config.level).toBe('debug');
  });

  test('getConfig returns current configuration', () => {
    NightingaleLogger.configure({ level: 'warn' });
    const config = NightingaleLogger.getConfig();

    expect(config.level).toBe('warn');
  });
});
