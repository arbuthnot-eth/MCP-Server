/**
 * Logger utility for PayPal MCP Server
 * 
 * Provides a centralized logging mechanism with configurable log levels.
 */

import { config } from '../config.js';

/**
 * Log levels with numeric values for comparison
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Current log level from configuration
 */
const currentLevel = LOG_LEVELS[config.server.logLevel];

/**
 * Format a log message with timestamp and level
 */
function formatLogMessage(level: string, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (args.length > 0) {
    formattedMessage += ' ' + args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      } else {
        return String(arg);
      }
    }).join(' ');
  }
  
  return formattedMessage;
}

/**
 * Logger implementation
 */
export const logger = {
  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatLogMessage('error', message, ...args));
    }
  },

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatLogMessage('warn', message, ...args));
    }
  },

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (currentLevel >= LOG_LEVELS.info) {
      console.info(formatLogMessage('info', message, ...args));
    }
  },

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.debug(formatLogMessage('debug', message, ...args));
    }
  },
};
