/**
 * Production-ready logging utility for WebRTC debugging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage("INFO", message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, data));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error;

      console.error(this.formatMessage("ERROR", message, errorData));
    }
  }

  // WebRTC specific logging methods
  webrtcEvent(event: string, data?: any): void {
    this.info(`WebRTC Event: ${event}`, data);
  }

  connectionState(state: string, data?: any): void {
    this.info(`Connection State: ${state}`, data);
  }

  openaiMessage(type: string, data?: any): void {
    this.debug(`OpenAI Message: ${type}`, data);
  }

  permissionEvent(event: string, granted: boolean): void {
    this.info(`Permission: ${event} - ${granted ? "GRANTED" : "DENIED"}`);
  }

  streamEvent(event: string, streamId?: string): void {
    this.info(`Stream Event: ${event}`, streamId ? { streamId } : undefined);
  }
}

export const logger = new Logger();
