/**
 * Logger utility for the FlatCrawl application
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger class
 */
export class Logger {
  /**
   * Create a new logger
   * @param context The context for the logger (e.g., the module name)
   * @param minLevel The minimum log level to display
   */
  constructor(
    private context: string,
    private minLevel: LogLevel = LogLevel.DEBUG
  ) {}
  
  /**
   * Log a debug message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }
  
  /**
   * Log an info message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }
  
  /**
   * Log an error message
   * @param message The message to log
   * @param args Additional arguments to log
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
  
  /**
   * Log a message at the specified level
   * @param level The log level
   * @param message The message to log
   * @param args Additional arguments to log
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.minLevel) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}] [${this.context}]`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
    }
  }
}