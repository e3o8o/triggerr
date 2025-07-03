export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
// A simple logger that prints to the console with timestamps and levels
export class Logger {
    level;
    context;
    constructor(level = LogLevel.INFO, context) {
        this.level = level;
        this.context = context;
    }
    log(level, message, ...args) {
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
    info(message, ...args) {
        this.log(LogLevel.INFO, message, ...args);
    }
    warn(message, ...args) {
        this.log(LogLevel.WARN, message, ...args);
    }
    error(message, ...args) {
        this.log(LogLevel.ERROR, message, ...args);
    }
    debug(message, ...args) {
        this.log(LogLevel.DEBUG, message, ...args);
    }
}
// Optional: A default logger instance
export const defaultLogger = new Logger(LogLevel.INFO, "APP");
//# sourceMappingURL=logger.js.map