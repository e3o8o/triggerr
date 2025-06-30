export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

// A simple logger that prints to the console with timestamps and levels
export class Logger {
  private readonly level: LogLevel;
  private readonly context?: string;

  constructor(level: LogLevel = LogLevel.INFO, context?: string) {
    this.level = level;
    this.context = context;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const levelValue = Object.values(LogLevel).indexOf(level);
    const configuredLevelValue = Object.values(LogLevel).indexOf(this.level);

    if (levelValue >= configuredLevelValue) {
      const timestamp = new Date().toISOString();
      const contextPrefix = this.context ? `[${this.context}] ` : "";
      const logMessage = `${timestamp} [${level}] ${contextPrefix}${message}`;

      switch (level) {
        case LogLevel.INFO:
          console.info(logMessage, ...args);
          break;
        case LogLevel.WARN:
          console.warn(logMessage, ...args);
          break;
        case LogLevel.ERROR:
          console.error(logMessage, ...args);
          break;
        case LogLevel.DEBUG:
          console.debug(logMessage, ...args);
          break;
        default:
          console.log(logMessage, ...args);
      }
    }
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }
}

// Optional: A default logger instance
export const defaultLogger = new Logger(LogLevel.INFO, "APP");
