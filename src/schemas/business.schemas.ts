/**
 * Business schemas for PayPal MCP Server
 * 
 * Defines Zod validation schemas for business-related operations.
 */

import { z } from 'zod';

/**
 * Common schemas
 */
const currencyCodeSchema = z.string().length(3).toUpperCase();

const amountSchema = z.object({
  currency_code: currencyCodeSchema,
  value: z.string().regex(/^\d+\.?\d*$/, 'Must be a valid currency amount'),
});

/**
 * Create Product Schema
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Product description is required'),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']),
  category: z.string().min(1, 'Product category is required'),
  image_url: z.string().url('Must be a valid URL').optional(),
  home_url: z.string().url('Must be a valid URL').optional(),
});

/**
 * Create Invoice Schema
 */
export const createInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  reference: z.string().min(1, 'Reference is required'),
  currency_code: currencyCodeSchema,
  recipient_email: z.string().email('Must be a valid email address'),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Item name is required'),
      quantity: z.string().regex(/^\d+$/, 'Quantity must be a positive integer'),
      unit_amount: amountSchema,
      description: z.string().optional(),
      tax: z.object({
        name: z.string().min(1, 'Tax name is required'),
        percent: z.string().regex(/^\d+(\.\d+)?$/, 'Tax percent must be a valid number'),
      }).optional(),
    })
  ).min(1, 'At least one item is required'),
  note: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  memo: z.string().optional(),
  payment_term: z.object({
    term_type: z.enum([
      'DUE_ON_RECEIPT',
      'DUE_ON_DATE',
      'NET_10',
      'NET_15',
      'NET_30',
      'NET_45',
      'NET_60',
      'NET_90',
    ]),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional(),
  }).optional(),
});

/**
 * Create Payout Schema
 */
export const createPayoutSchema = z.object({
  sender_batch_header: z.object({
    sender_batch_id: z.string().min(1, 'Sender batch ID is required'),
    email_subject: z.string().optional(),
    recipient_type: z.string().optional(),
  }),
  items: z.array(
    z.object({
      recipient_type: z.string().min(1, 'Recipient type is required'),
      amount: z.object({
        value: z.string().regex(/^\d+\.?\d*$/, 'Must be a valid currency amount'),
        currency: currencyCodeSchema,
      }),
      receiver: z.string().min(1, 'Receiver is required'),
      note: z.string().optional(),
    })
  ).min(1, 'At least one payout item is required'),
});

/**
 * Export all business schemas
 */
export const businessSchemas = {
  createProductSchema,
  createInvoiceSchema,
  createPayoutSchema,
};
