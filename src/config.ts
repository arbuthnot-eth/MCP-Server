/**
 * Configuration module for PayPal MCP Server
 * 
 * Loads and validates environment variables and provides a centralized
 * configuration object for the application.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

/**
 * Environment validation
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * PayPal environment type
 */
type PayPalEnvironment = 'sandbox' | 'live';

/**
 * Log level type
 */
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Application configuration
 */
export const config = {
  paypal: {
    clientId: getRequiredEnv('PAYPAL_CLIENT_ID'),
    clientSecret: getRequiredEnv('PAYPAL_CLIENT_SECRET'),
    environment: getOptionalEnv('PAYPAL_ENVIRONMENT', 'sandbox') as PayPalEnvironment,
    apiBaseUrl: getOptionalEnv('PAYPAL_ENVIRONMENT', 'sandbox') === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com',
    tokenCacheSeconds: parseInt(getOptionalEnv('PAYPAL_TOKEN_CACHE_SECONDS', '3500'), 10),
  },
  server: {
    logLevel: getOptionalEnv('LOG_LEVEL', 'info') as LogLevel,
    requestTimeout: parseInt(getOptionalEnv('REQUEST_TIMEOUT', '30000'), 10),
    maxRetries: parseInt(getOptionalEnv('MAX_RETRIES', '3'), 10),
    retryDelay: parseInt(getOptionalEnv('RETRY_DELAY', '1000'), 10),
  },
};

// Validate PayPal environment
if (!['sandbox', 'live'].includes(config.paypal.environment)) {
  throw new Error(`Invalid PayPal environment: ${config.paypal.environment}. Must be 'sandbox' or 'live'.`);
}

// Validate log level
if (!['error', 'warn', 'info', 'debug'].includes(config.server.logLevel)) {
  console.warn(`Invalid log level: ${config.server.logLevel}. Defaulting to 'info'.`);
  config.server.logLevel = 'info';
}
