// ===========================================================================
// API SDK - LOGGER UTILITY
// ===========================================================================

/**
 * Available log levels in order of verbosity (from most to least verbose)
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Standardized logger interface
 */
export type Logger = ((
  level: LogLevel,
  message: string,
  context?: any
) => void) | undefined;

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /**
   * Whether logging is enabled
   */
  enabled?: boolean;

  /**
   * Minimum log level to output
   * - 'debug': All logs (most verbose)
   * - 'info': Info, warnings, and errors
   * - 'warn': Only warnings and errors
   * - 'error': Only errors (least verbose)
   */
  level?: LogLevel;

  /**
   * Optional prefix to prepend to all log messages
   */
  prefix?: string;

  /**
   * Optional custom logger implementation
   * If not provided, logs to console
   */
  logger?: Logger;
}

/**
 * Log level priority (higher number = higher priority)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Creates a logger instance with the specified configuration
 */
export function createLogger(config: LoggerConfig = {}) {
  const {
    enabled = true,
    level = 'info',
    prefix = '',
    logger = defaultLogger as Logger,
  } = config;

  const minLevelPriority = LOG_LEVEL_PRIORITY[level];

  /**
   * Determines if a given log level should be output based on configuration
   */
  function shouldLog(messageLevel: LogLevel): boolean {
    if (!enabled) return false;
    return LOG_LEVEL_PRIORITY[messageLevel] >= minLevelPriority;
  }

  /**
   * Formats a message with the optional prefix
   */
  function formatMessage(message: string): string {
    return prefix ? `${prefix} ${message}` : message;
  }

  // Create a safe wrapper function for the logger
  const loggerFn = logger || defaultLogger;

  return {
    /**
     * Logs a debug message
     */
    debug(message: string, context?: any): void {
      if (shouldLog('debug')) {
        loggerFn('debug', formatMessage(message), context);
      }
    },

    /**
     * Logs an info message
     */
    info(message: string, context?: any): void {
      if (shouldLog('info')) {
        loggerFn('info', formatMessage(message), context);
      }
    },

    /**
     * Logs a warning message
     */
    warn(message: string, context?: any): void {
      if (shouldLog('warn')) {
        loggerFn('warn', formatMessage(message), context);
      }
    },

    /**
     * Logs an error message
     */
    error(message: string, context?: any): void {
      if (shouldLog('error')) {
        loggerFn('error', formatMessage(message), context);
      }
    },

    /**
     * Logs a message with the specified level
     */
    log(level: LogLevel, message: string, context?: any): void {
      if (shouldLog(level)) {
        loggerFn(level, formatMessage(message), context);
      }
    },

    /**
     * Returns a child logger with an extended prefix
     */
    child(childPrefix: string) {
      return createLogger({
        enabled,
        level,
        prefix: prefix ? `${prefix}:${childPrefix}` : childPrefix,
        logger,
      });
    },

    /**
     * Returns the current logger configuration
     */
    getConfig(): LoggerConfig {
      return {
        enabled,
        level,
        prefix,
        logger,
      };
    },
  };
}

/**
 * Default logger implementation that logs to console
 */
export function defaultLogger(level: LogLevel, message: string, context?: any): void {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'debug':
      if (context) {
        console.debug(logPrefix, message, context);
      } else {
        console.debug(logPrefix, message);
      }
      break;
    case 'info':
      if (context) {
        console.info(logPrefix, message, context);
      } else {
        console.info(logPrefix, message);
      }
      break;
    case 'warn':
      if (context) {
        console.warn(logPrefix, message, context);
      } else {
        console.warn(logPrefix, message);
      }
      break;
    case 'error':
      if (context) {
        console.error(logPrefix, message, context);
      } else {
        console.error(logPrefix, message);
      }
      break;
  }
}

/**
 * No-op logger that does nothing
 */
export function noopLogger(): void {
  // No operation
}

/**
 * Creates a logger that only outputs errors
 */
export function createErrorOnlyLogger(): ReturnType<typeof createLogger> {
  return createLogger({
    enabled: true,
    level: 'error',
  });
}

/**
 * Creates a silent logger that does nothing
 */
export function createSilentLogger(): ReturnType<typeof createLogger> {
  return createLogger({
    enabled: false,
    logger: noopLogger,
  });
}
