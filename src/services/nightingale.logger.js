/**
 * Nightingale Structured Logger (Scaffold)
 *
 * Provides a minimal, pluggable logging interface without direct console usage.
 * Designed to allow future transport integration (console, remote, file) while
 * keeping the current codebase free from ad hoc logging.
 *
 * Goals:
 * - No direct console.* calls here or in callers (callers use this abstraction)
 * - Lightweight: small runtime footprint, cheap no-op when disabled
 * - Namespaced loggers: logger.get('services:autosave')
 * - Level filtering (trace, debug, info, warn, error, silent)
 * - Structured entry shape for future persistence / export
 * - Buffer option for capturing early boot events
 */

(function (window) {
  'use strict';

  // ============================================================================
  // CONFIG & LEVELS
  // ============================================================================
  const LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];
  const LEVEL_WEIGHT = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    silent: 100,
  };

  const defaultConfig = {
    level: 'info', // global minimum level
    buffered: true, // capture entries until a transport attaches
    bufferLimit: 500,
    flushOnLevel: 'error', // auto-flush when an error is logged (if buffered)
    transports: [], // { id, write(entry) }
    enrichers: [], // functions(entry) -> void (side-effect mutate)
    timeProvider: () => new Date(),
    includeMeta: true,
  };

  // Shallow clone so mutations don't affect template
  let activeConfig = { ...defaultConfig };
  const buffer = [];

  // ============================================================================
  // UTILS
  // ============================================================================
  function validLevel(lvl) {
    return Object.prototype.hasOwnProperty.call(LEVEL_WEIGHT, lvl)
      ? lvl
      : 'info';
  }

  function shouldLog(lvl) {
    return LEVEL_WEIGHT[lvl] >= LEVEL_WEIGHT[activeConfig.level];
  }

  function clone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (_) {
      return obj;
    }
  }

  // ============================================================================
  // CORE EMIT
  // ============================================================================
  function emit(entry) {
    // Enrich
    if (activeConfig.includeMeta) {
      entry.meta = entry.meta || {};
      if (!entry.meta.ts)
        entry.meta.ts = activeConfig.timeProvider().toISOString();
    }
    for (const enricher of activeConfig.enrichers) {
      try {
        enricher(entry);
      } catch (_) {
        /* swallow */
      }
    }

    // Buffering path
    if (activeConfig.buffered && activeConfig.transports.length === 0) {
      buffer.push(entry);
      if (buffer.length > activeConfig.bufferLimit) buffer.shift();
      return;
    }

    // Direct transport delivery
    for (const t of activeConfig.transports) {
      try {
        t.write(clone(entry));
      } catch (_) {
        /* swallow */
      }
    }

    // Auto-flush trigger if buffering still on
    if (
      activeConfig.buffered &&
      activeConfig.flushOnLevel &&
      LEVEL_WEIGHT[entry.level] >= LEVEL_WEIGHT[activeConfig.flushOnLevel]
    ) {
      flushBuffer();
    }
  }

  function flushBuffer() {
    if (buffer.length === 0 || activeConfig.transports.length === 0) return;
    const snapshot = buffer.splice(0, buffer.length); // clear
    for (const entry of snapshot) {
      for (const t of activeConfig.transports) {
        try {
          t.write(clone(entry));
        } catch (_) {
          /* swallow */
        }
      }
    }
  }

  // ============================================================================
  // LOGGER FACTORY
  // ============================================================================
  function buildLogger(namespace) {
    const logger = {};
    for (const lvl of LEVELS) {
      if (lvl === 'silent') continue;
      logger[lvl] = (message, data = null, meta = null) => {
        const level = validLevel(lvl);
        if (!shouldLog(level)) return null;
        const entry = {
          level,
          namespace,
          message: typeof message === 'function' ? safeEval(message) : message,
          data: data && typeof data === 'function' ? safeEval(data) : data,
          meta: meta || {},
        };
        emit(entry);
        return entry;
      };
    }
    // Structured child logger
    logger.child = (suffix) =>
      buildLogger(namespace ? `${namespace}:${suffix}` : suffix);
    return logger;
  }

  function safeEval(fn) {
    try {
      return fn();
    } catch (_) {
      return null;
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================
  const NightingaleLogger = {
    version: '0.1.0',
    name: 'NightingaleLogger',
    get: (namespace = '') => buildLogger(namespace),
    configure(options = {}) {
      if (!options || typeof options !== 'object') return clone(activeConfig);
      activeConfig = { ...activeConfig, ...options };
      // Ensure level validity
      activeConfig.level = validLevel(activeConfig.level);
      if (!Array.isArray(activeConfig.transports)) activeConfig.transports = [];
      if (!Array.isArray(activeConfig.enrichers)) activeConfig.enrichers = [];
      if (typeof activeConfig.timeProvider !== 'function') {
        activeConfig.timeProvider = () => new Date();
      }
      // If transports newly present, flush
      if (!activeConfig.buffered) flushBuffer();
      else if (activeConfig.transports.length > 0) flushBuffer();
      return clone(activeConfig);
    },
    addTransport(transport) {
      if (!transport || typeof transport.write !== 'function') return false;
      activeConfig.transports.push(transport);
      flushBuffer();
      return true;
    },
    removeTransport(id) {
      const before = activeConfig.transports.length;
      activeConfig.transports = activeConfig.transports.filter(
        (t) => t.id !== id
      );
      return before !== activeConfig.transports.length;
    },
    addEnricher(enricher) {
      if (typeof enricher !== 'function') return false;
      activeConfig.enrichers.push(enricher);
      return true;
    },
    clearEnrichers() {
      activeConfig.enrichers = [];
    },
    getConfig() {
      return clone(activeConfig);
    },
    flush: flushBuffer,
    // Quick diagnostic snapshot (no console output)
    snapshotBuffer() {
      return clone(buffer);
    },
  };

  // Register globally & with service registry
  if (typeof window !== 'undefined') {
    window.NightingaleLogger = NightingaleLogger;
    if (
      window.NightingaleServices &&
      window.NightingaleServices.registerService
    ) {
      try {
        window.NightingaleServices.registerService(
          'logger',
          NightingaleLogger,
          'core'
        );
      } catch (_) {
        /* swallow */
      }
    }
  }

  // Module export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NightingaleLogger;
  }

  return NightingaleLogger;
})(typeof window !== 'undefined' ? window : this);

// ES6 default export
export default (typeof window !== 'undefined' && window.NightingaleLogger) ||
  null;
