/**
 * Payment tools for PayPal MCP Server
 * 
 * Implements payment-related tools for the MCP server.
 */

import { PayPalAuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { sanitizeForLogging } from '../utils/validation.js';

/**
 * Create Payment Token
 * 
 * Creates a payment token for future use.
 */
async function createPaymentToken(args: any, authService: PayPalAuthService) {
  logger.info('Creating payment token');
  logger.debug('Payment token args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post('/v1/vault/payment-tokens', args);
    return response.data;
  } catch (error) {
    logger.error('Error creating payment token:', error);
    throw new Error('Failed to create payment token: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Create Order
 * 
 * Creates a new order in PayPal.
 */
async function createOrder(args: any, authService: PayPalAuthService) {
  logger.info('Creating order');
  logger.debug('Order args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post('/v2/checkout/orders', args);
    return response.data;
  } catch (error) {
    logger.error('Error creating order:', error);
    throw new Error('Failed to create order: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Capture Order
 * 
 * Captures payment for an authorized order.
 */
async function captureOrder(args: any, authService: PayPalAuthService) {
  const { order_id, payment_source } = args;
  
  logger.info(`Capturing order: ${order_id}`);
  logger.debug('Capture args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post(
      `/v2/checkout/orders/${order_id}/capture`,
      payment_source ? { payment_source } : {}
    );
    return response.data;
  } catch (error) {
    logger.error(`Error capturing order ${order_id}:`, error);
    throw new Error('Failed to capture order: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Create Payment
 * 
 * Creates a direct payment.
 */
async function createPayment(args: any, authService: PayPalAuthService) {
  logger.info('Creating payment');
  logger.debug('Payment args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post('/v1/payments/payment', args);
    return response.data;
  } catch (error) {
    logger.error('Error creating payment:', error);
    throw new Error('Failed to create payment: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Create Subscription
 * 
 * Creates a subscription for recurring billing.
 */
async function createSubscription(args: any, authService: PayPalAuthService) {
  const { plan_id, ...rest } = args;
  
  logger.info(`Creating subscription for plan: ${plan_id}`);
  logger.debug('Subscription args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post('/v1/billing/subscriptions', rest);
    return response.data;
  } catch (error) {
    logger.error(`Error creating subscription for plan ${plan_id}:`, error);
    throw new Error('Failed to create subscription: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Payment tools definition
 */
export const paymentTools = [
  {
    name: 'create_payment_token',
    description: 'Create a payment token for future use',
    inputSchema: {
      type: 'object',
      properties: {
        customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email_address: { type: 'string' },
          },
          required: ['id'],
        },
        payment_source: {
          type: 'object',
          properties: {
            card: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                number: { type: 'string' },
                expiry: { type: 'string' },
                security_code: { type: 'string' },
              },
              required: ['name', 'number', 'expiry', 'security_code'],
            },
            paypal: {
              type: 'object',
              properties: {
                email_address: { type: 'string' },
              },
              required: ['email_address'],
            },
          },
        },
      },
      required: ['customer', 'payment_source'],
    },
    handler: createPaymentToken,
  },
  {
    name: 'create_order',
    description: 'Create a new order in PayPal',
    inputSchema: {
      type: 'object',
      properties: {
        intent: { type: 'string', enum: ['CAPTURE', 'AUTHORIZE'] },
        purchase_units: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              amount: {
                type: 'object',
                properties: {
                  currency_code: { type: 'string' },
                  value: { type: 'string' },
                },
                required: ['currency_code', 'value'],
              },
              description: { type: 'string' },
              reference_id: { type: 'string' },
            },
            required: ['amount'],
          },
        },
      },
      required: ['intent', 'purchase_units'],
    },
    handler: createOrder,
  },
  {
    name: 'capture_order',
    description: 'Capture payment for an authorized order',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string' },
        payment_source: {
          type: 'object',
          properties: {
            token: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
              },
              required: ['id', 'type'],
            },
          },
        },
      },
      required: ['order_id'],
    },
    handler: captureOrder,
  },
  {
    name: 'create_payment',
    description: 'Create a direct payment',
    inputSchema: {
      type: 'object',
      properties: {
        intent: { type: 'string' },
        payer: {
          type: 'object',
          properties: {
            payment_method: { type: 'string' },
          },
          required: ['payment_method'],
        },
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              amount: {
                type: 'object',
                properties: {
                  total: { type: 'string' },
                  currency: { type: 'string' },
                },
                required: ['total', 'currency'],
              },
            },
            required: ['amount'],
          },
        },
      },
      required: ['intent', 'payer', 'transactions'],
    },
    handler: createPayment,
  },
  {
    name: 'create_subscription',
    description: 'Create a subscription for recurring billing',
    inputSchema: {
      type: 'object',
      properties: {
        plan_id: { type: 'string' },
        subscriber: {
          type: 'object',
          properties: {
            name: {
              type: 'object',
              properties: {
                given_name: { type: 'string' },
                surname: { type: 'string' },
              },
              required: ['given_name', 'surname'],
            },
            email_address: { type: 'string' },
          },
          required: ['name', 'email_address'],
        },
      },
      required: ['plan_id', 'subscriber'],
    },
    handler: createSubscription,
  },
];
