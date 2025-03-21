/**
 * Input validation utility for PayPal MCP Server
 * 
 * Provides validation for tool inputs using Zod schemas.
 */

import { z } from 'zod';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { logger } from './logger.js';

// Import schemas
import { paymentSchemas } from '../schemas/payment.schemas.js';
import { businessSchemas } from '../schemas/business.schemas.js';
import { userSchemas } from '../schemas/user.schemas.js';

/**
 * Map of tool names to their validation schemas
 */
const schemaMap: Record<string, z.ZodType<any>> = {
  // Payment schemas
  create_payment_token: paymentSchemas.createPaymentTokenSchema,
  create_order: paymentSchemas.createOrderSchema,
  capture_order: paymentSchemas.captureOrderSchema,
  create_payment: paymentSchemas.createPaymentSchema,
  create_subscription: paymentSchemas.createSubscriptionSchema,
  
  // Business schemas
  create_product: businessSchemas.createProductSchema,
  create_invoice: businessSchemas.createInvoiceSchema,
  create_payout: businessSchemas.createPayoutSchema,
  
  // User schemas
  get_userinfo: userSchemas.getUserInfoSchema,
  create_web_profile: userSchemas.createWebProfileSchema,
};

/**
 * Validate input arguments against the appropriate schema
 * 
 * @param toolName - The name of the tool being called
 * @param args - The input arguments to validate
 * @returns The validated and typed arguments
 * @throws McpError if validation fails
 */
export function validateInput(toolName: string, args: any): any {
  const schema = schemaMap[toolName];
  
  if (!schema) {
    logger.warn(`No validation schema found for tool: ${toolName}`);
    return args;
  }
  
  try {
    return schema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`;
      }).join(', ');
      
      logger.error(`Validation error for ${toolName}:`, formattedErrors);
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters for ${toolName}: ${formattedErrors}`
      );
    }
    
    throw error;
  }
}

/**
 * Sanitize sensitive data for logging
 * 
 * @param data - The data to sanitize
 * @returns Sanitized data with sensitive fields masked
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'client_secret',
    'clientSecret',
    'secret',
    'password',
    'security_code',
    'cvv',
    'cvv2',
    'card_number',
    'number',
    'access_token',
    'refresh_token',
    'token',
  ];
  
  const result = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in result) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizeForLogging(result[key]);
    }
  }
  
  return result;
}
