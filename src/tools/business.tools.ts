/**
 * Business tools for PayPal MCP Server
 * 
 * Implements business-related tools for the MCP server.
 */

import { PayPalAuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { sanitizeForLogging } from '../utils/validation.js';

/**
 * Create Product
 * 
 * Creates a new product in the catalog.
 */
async function createProduct(args: any, authService: PayPalAuthService) {
  logger.info('Creating product');
  logger.debug('Product args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post('/v1/catalogs/products', args);
    return response.data;
  } catch (error) {
    logger.error('Error creating product:', error);
    throw new Error('Failed to create product: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Create Invoice
 * 
 * Generates a new invoice.
 */
async function createInvoice(args: any, authService: PayPalAuthService) {
  logger.info('Creating invoice');
  logger.debug('Invoice args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  // Transform the input to match PayPal's API format
  const invoiceData = {
    detail: {
      invoice_number: args.invoice_number,
      reference: args.reference,
      currency_code: args.currency_code,
      note: args.note,
      terms_and_conditions: args.terms_and_conditions,
      memo: args.memo,
      payment_term: args.payment_term,
    },
    invoicer: {
      // This would typically come from the merchant's profile
      // For now, we'll use minimal required fields
      name: {
        given_name: 'Business',
        surname: 'Owner',
      },
    },
    primary_recipients: [
      {
        billing_info: {
          email_address: args.recipient_email,
        },
      },
    ],
    items: args.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unit_amount: item.unit_amount,
      description: item.description,
      tax: item.tax,
    })),
  };
  
  try {
    const response = await client.post('/v2/invoicing/invoices', invoiceData);
    return response.data;
  } catch (error) {
    logger.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Create Payout
 * 
 * Process a batch payout.
 */
async function createPayout(args: any, authService: PayPalAuthService) {
  logger.info('Creating payout');
  logger.debug('Payout args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post('/v1/payments/payouts', args);
    return response.data;
  } catch (error) {
    logger.error('Error creating payout:', error);
    throw new Error('Failed to create payout: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Business tools definition
 */
export const businessTools = [
  {
    name: 'create_product',
    description: 'Create a new product in the catalog',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['PHYSICAL', 'DIGITAL', 'SERVICE'] },
        category: { type: 'string' },
        image_url: { type: 'string' },
        home_url: { type: 'string' },
      },
      required: ['name', 'description', 'type', 'category'],
    },
    handler: createProduct,
  },
  {
    name: 'create_invoice',
    description: 'Generate a new invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_number: { type: 'string' },
        reference: { type: 'string' },
        currency_code: { type: 'string' },
        recipient_email: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'string' },
              unit_amount: {
                type: 'object',
                properties: {
                  currency_code: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['currency_code', 'value'],
              },
            },
            required: ['name', 'quantity', 'unit_amount'],
          },
        },
      },
      required: ['invoice_number', 'reference', 'currency_code', 'recipient_email', 'items'],
    },
    handler: createInvoice,
  },
  {
    name: 'create_payout',
    description: 'Process a batch payout',
    inputSchema: {
      type: 'object',
      properties: {
        sender_batch_header: {
          type: 'object',
          properties: {
            sender_batch_id: { type: 'string' },
            email_subject: { type: 'string' },
            recipient_type: { type: 'string' },
          },
          required: ['sender_batch_id'],
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recipient_type: { type: 'string' },
              amount: {
                type: 'object',
                properties: {
                  value: { type: 'string' },
                  currency: { type: 'string' },
                },
                required: ['value', 'currency'],
              },
              receiver: { type: 'string' },
              note: { type: 'string' },
            },
            required: ['recipient_type', 'amount', 'receiver'],
          },
        },
      },
      required: ['sender_batch_header', 'items'],
    },
    handler: createPayout,
  },
];
