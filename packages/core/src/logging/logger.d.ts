export declare enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    DEBUG = "DEBUG"
}
export declare class Logger {
    private readonly level;
    private readonly context?;
    constructor(level?: LogLevel, context?: string);
    private log;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
export declare const defaultLogger: Logger;
//# sourceMappingURL=logger.d.ts.map