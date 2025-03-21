/**
 * User schemas for PayPal MCP Server
 * 
 * Defines Zod validation schemas for user-related operations.
 */

import { z } from 'zod';

/**
 * Get User Info Schema
 */
export const getUserInfoSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
});

/**
 * Create Web Profile Schema
 */
export const createWebProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  presentation: z.object({
    brand_name: z.string().optional(),
    logo_image: z.string().url('Must be a valid URL').optional(),
    locale_code: z.string().optional(),
  }).optional(),
  input_fields: z.object({
    no_shipping: z.number().int().min(0).max(1).optional(),
    address_override: z.number().int().min(0).max(1).optional(),
  }).optional(),
  flow_config: z.object({
    landing_page_type: z.string().optional(),
    bank_txn_pending_url: z.string().url('Must be a valid URL').optional(),
  }).optional(),
});

/**
 * Export all user schemas
 */
export const userSchemas = {
  getUserInfoSchema,
  createWebProfileSchema,
};
