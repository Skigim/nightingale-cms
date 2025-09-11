/**
 * Nightingale Logger Quick Start Guide
 *
 * "The first step into darkness requires light"
 *
 * This file shows how to set up and use the logger system.
 * Copy these patterns into your services and components.
 */

/* eslint-disable no-unused-vars, no-undef */

// ============================================================================
// BASIC SETUP - "Light the beacon"
// ============================================================================

function initializeLogging() {
  const logger = window.NightingaleLogger;

  if (!logger) {
    console.warn('Logger not available - continuing in silence');
    return null;
  }

  // Quick setup with console + memory transports and basic enrichers
  logger.setupBasic(true); // true = enable console output

  // Optional: Set minimum log level (trace, debug, info, warn, error, silent)
  logger.configure({ level: 'info' });

  return logger;
}

// ============================================================================
// USAGE EXAMPLES - "Every expedition leaves traces"
// ============================================================================

function demonstrateLogging() {
  const logger = window.NightingaleLogger?.get('quickstart');

  if (!logger) {
    console.log('Logger not initialized');
    return;
  }

  // Basic logging
  logger.info('Application started', { version: '2.0.0' });
  logger.debug('Debug information', {
    details: 'Only shown if level is debug or trace',
  });

  // Logging with structured data
  logger.info('User action', {
    action: 'open_case',
    caseId: 'VR-12345',
    timestamp: new Date().toISOString(),
  });

  // Error logging with context
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error('Operation failed', {
      error: error.message,
      stack: error.stack,
      operation: 'demonstration',
    });
  }

  // Warning for non-fatal issues
  logger.warn('Deprecated function used', {
    function: 'oldFunction',
    replacement: 'newFunction',
    deprecationDate: '2025-09-01',
  });
}

// ============================================================================
// NAMESPACED LOGGERS - "Each path tells its own story"
// ============================================================================

function createServiceLoggers() {
  // Create loggers for different parts of your app
  const dataLogger = window.NightingaleLogger?.get('services:data');
  const uiLogger = window.NightingaleLogger?.get('components:ui');
  const businessLogger = window.NightingaleLogger?.get('components:business');

  return { dataLogger, uiLogger, businessLogger };
}

// ============================================================================
// REPLACING SILENT CATCHES - "When one falls, we continue"
// ============================================================================

function beforeAndAfter() {
  const logger = window.NightingaleLogger?.get('migration:example');

  // ❌ OLD WAY - Silent failure
  function oldWayBad() {
    try {
      // risky operation
      JSON.parse('invalid json');
    } catch (error) {
      // Silent - you never know this failed!
    }
  }

  // ✅ NEW WAY - Logged failure
  function newWayGood() {
    try {
      // risky operation
      JSON.parse('invalid json');
    } catch (error) {
      logger?.warn('JSON parse failed but continuing', {
        error: error.message,
        operation: 'data parsing',
        input: 'user provided data',
      });
      return null; // or some safe default
    }
  }
}

// ============================================================================
// EXPORT AND DEBUGGING - "For those who come after"
// ============================================================================

function debuggingHelpers() {
  const logger = window.NightingaleLogger;

  if (!logger) return;

  // Get current configuration
  const config = logger.getConfig();
  console.log('Current logger config:', config);

  // Export recent logs as JSON for download
  const logsJson = logger.exportLogs('json');
  console.log('Recent logs:', logsJson);

  // Export as CSV for spreadsheet analysis
  const logsCsv = logger.exportLogs('csv');
  console.log('CSV format:', logsCsv);

  // Export as human-readable text
  const logsText = logger.exportLogs('text');
  console.log('Text format:', logsText);

  // Get just the current buffer (before any transports)
  const buffer = logger.snapshotBuffer();
  console.log('Current buffer:', buffer);
}

// ============================================================================
// INTEGRATION PATTERNS - "The web that connects all things"
// ============================================================================

// Pattern 1: Service initialization
function serviceWithLogging() {
  const logger = window.NightingaleLogger?.get('services:example');

  return {
    doSomething(data) {
      logger?.info('Starting operation', { dataSize: data?.length });

      try {
        // actual work
        const result = processData(data);
        logger?.info('Operation completed', { resultSize: result?.length });
        return result;
      } catch (error) {
        logger?.error('Operation failed', {
          error: error.message,
          input: data ? 'provided' : 'missing',
        });
        throw error; // Re-throw if this should be fatal
      }
    },
  };
}

// Pattern 2: Component lifecycle logging
function componentWithLogging() {
  const logger = window.NightingaleLogger?.get('components:example');

  // Log component mount
  logger?.debug('Component mounted');

  // Log user interactions
  function handleUserAction(action, data) {
    logger?.info('User interaction', { action, data });
  }

  // Log component unmount
  function cleanup() {
    logger?.debug('Component unmounting');
  }

  return { handleUserAction, cleanup };
}

// ============================================================================
// BOOTSTRAP - "Let there be light"
// ============================================================================

// Call this early in your app initialization
if (typeof window !== 'undefined' && window.NightingaleLogger) {
  initializeLogging();

  // Optional: Add custom context enricher
  window.NightingaleLogger.addEnricher(
    window.NightingaleLogger.enrichers.context(() => ({
      page: window.location.pathname,
      user: 'anonymous', // Replace with actual user context when available
    })),
  );

  console.log(
    '🌟 Nightingale Logger initialized - "The darkness holds no secrets now"',
  );
}

// Example of immediate use
const appLogger = window.NightingaleLogger?.get('app:main');
appLogger?.info('Quick start guide loaded', {
  guide: 'logger-quickstart.js',
  motto: 'When one falls, we continue',
});

/**
 * NEXT STEPS:
 *
 * 1. Add this script to your main HTML page after the logger service
 * 2. Call initializeLogging() early in your app startup
 * 3. Replace silent catch blocks in your services with logger.warn/error calls
 * 4. Create namespaced loggers for different parts of your app
 * 5. Use logger.exportLogs() when users report bugs
 *
 * Remember: "Every detail tells a story" - log enough to debug,
 * but not so much that you overwhelm the signal with noise.
 */
