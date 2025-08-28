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
  // BUILT-IN TRANSPORTS - "When one falls, we continue."
  // ============================================================================

  /**
   * Console Transport - Echoes through the void
   * Sends log entries to browser developer console
   */
  const ConsoleTransport = {
    id: 'console',
    enabled: true,

    write(entry) {
      if (!this.enabled || typeof console === 'undefined') return;

      const prefix = `[${entry.level.toUpperCase()}] ${entry.namespace || 'unknown'}`;
      const message = `${prefix} - ${entry.message}`;

      // "The darkness reveals what daylight conceals"
      switch (entry.level) {
        case 'trace':
        case 'debug':
          if (console.debug) console.debug(message, entry.data || '');
          else console.log(message, entry.data || '');
          break;
        case 'info':
          console.info(message, entry.data || '');
          break;
        case 'warn':
          console.warn(message, entry.data || '');
          break;
        case 'error':
          console.error(message, entry.data || '');
          break;
        default:
          console.log(message, entry.data || '');
      }
    },

    enable() {
      this.enabled = true;
    },
    disable() {
      this.enabled = false;
    },
  };

  /**
   * Memory Transport - "For those who come after"
   * Keeps recent entries in memory for export/debugging
   */
  function createMemoryTransport(maxEntries = 1000) {
    const entries = [];

    return {
      id: 'memory',
      maxEntries,

      write(entry) {
        entries.push({
          ...entry,
          capturedAt: new Date().toISOString(),
        });

        // "Time erodes all things, but some traces remain"
        if (entries.length > maxEntries) {
          entries.shift();
        }
      },

      getEntries() {
        return [...entries]; // Return copy to prevent mutation
      },

      clear() {
        entries.length = 0;
      },

      export(format = 'json') {
        switch (format) {
          case 'json':
            return JSON.stringify(entries, null, 2);
          case 'csv': {
            if (entries.length === 0) return '';
            const headers = 'timestamp,level,namespace,message,data\n';
            const rows = entries
              .map(
                (e) =>
                  `${e.capturedAt},${e.level},${e.namespace || ''},"${(e.message || '').replace(/"/g, '""')}","${JSON.stringify(e.data || '').replace(/"/g, '""')}"`
              )
              .join('\n');
            return headers + rows;
          }
          case 'text':
            return entries
              .map(
                (e) =>
                  `[${e.capturedAt}] ${e.level.toUpperCase()} ${e.namespace || 'unknown'} - ${e.message} ${e.data ? JSON.stringify(e.data) : ''}`
              )
              .join('\n');
          default:
            return entries;
        }
      },
    };
  }

  // ============================================================================
  // BUILT-IN ENRICHERS - "Every detail tells a story"
  // ============================================================================

  /**
   * Session ID Enricher - Tracks the journey of a single session
   */
  function createSessionEnricher() {
    // "Each expedition bears a unique mark"
    const sessionId =
      'expedition-' +
      Math.random().toString(36).substr(2, 9) +
      '-' +
      Date.now().toString(36);

    return function sessionEnricher(entry) {
      entry.meta = entry.meta || {};
      entry.meta.sessionId = sessionId;
    };
  }

  /**
   * Performance Enricher - Adds timing and memory info when available
   */
  function createPerformanceEnricher() {
    const startTime = performance?.now?.() || Date.now();

    return function performanceEnricher(entry) {
      entry.meta = entry.meta || {};

      // "Time flows differently in the depths"
      if (typeof performance !== 'undefined' && performance.now) {
        entry.meta.elapsed =
          Math.round((performance.now() - startTime) * 100) / 100; // ms, 2 decimals
      }

      // "Memory shapes the possible"
      if (typeof performance !== 'undefined' && performance.memory) {
        entry.meta.memory = {
          used:
            Math.round(
              (performance.memory.usedJSHeapSize / 1024 / 1024) * 100
            ) / 100, // MB
          total:
            Math.round(
              (performance.memory.totalJSHeapSize / 1024 / 1024) * 100
            ) / 100,
        };
      }
    };
  }

  /**
   * Context Enricher - Adds user action context when available
   */
  function createContextEnricher(getContext) {
    return function contextEnricher(entry) {
      if (typeof getContext === 'function') {
        try {
          const context = getContext();
          if (context) {
            entry.meta = entry.meta || {};
            entry.meta.context = context;
          }
        } catch (_) {
          // "Some knowledge is meant to remain hidden"
        }
      }
    };
  }

  // ============================================================================
  // PUBLIC API - "The light that guides through darkness"
  // ============================================================================
  const NightingaleLogger = {
    version: '0.2.0',
    name: 'NightingaleLogger',

    // Core logger factory
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

    // Transport management
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

    // Enricher management
    addEnricher(enricher) {
      if (typeof enricher !== 'function') return false;
      activeConfig.enrichers.push(enricher);
      return true;
    },

    clearEnrichers() {
      activeConfig.enrichers = [];
    },

    // Built-in factories - "Tools forged for the expedition"
    transports: {
      console: () => ConsoleTransport,
      memory: (maxEntries) => createMemoryTransport(maxEntries),
    },

    enrichers: {
      session: () => createSessionEnricher(),
      performance: () => createPerformanceEnricher(),
      context: (getContextFn) => createContextEnricher(getContextFn),
    },

    // Utility methods
    getConfig() {
      return clone(activeConfig);
    },

    flush: flushBuffer,

    // Quick diagnostic snapshot (no console output)
    snapshotBuffer() {
      return clone(buffer);
    },

    // Convenience setup methods - "The path made clear"
    setupBasic(enableConsole = true) {
      if (enableConsole) {
        this.addTransport(this.transports.console());
      }
      this.addTransport(this.transports.memory(500));
      this.addEnricher(this.enrichers.session());
      this.addEnricher(this.enrichers.performance());
      return this;
    },

    // Export recent logs for debugging
    exportLogs(format = 'json') {
      const memoryTransport = activeConfig.transports.find(
        (t) => t.id === 'memory'
      );
      if (memoryTransport && memoryTransport.export) {
        return memoryTransport.export(format);
      }
      return this.snapshotBuffer();
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
