/**
 * Payment schemas for PayPal MCP Server
 * 
 * Defines Zod validation schemas for payment-related operations.
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

const cardSchema = z.object({
  name: z.string().min(1, 'Card holder name is required'),
  number: z.string().regex(/^\d{13,19}$/, 'Card number must be between 13 and 19 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in format MM/YY'),
  security_code: z.string().regex(/^\d{3,4}$/, 'Security code must be 3 or 4 digits'),
});

const paypalSourceSchema = z.object({
  email_address: z.string().email('Must be a valid email address'),
});

/**
 * Create Payment Token Schema
 */
export const createPaymentTokenSchema = z.object({
  customer: z.object({
    id: z.string().min(1, 'Customer ID is required'),
    email_address: z.string().email('Must be a valid email address').optional(),
  }),
  payment_source: z.object({
    card: cardSchema.optional(),
    paypal: paypalSourceSchema.optional(),
  }).refine(data => data.card || data.paypal, {
    message: 'Either card or paypal payment source must be provided',
  }),
});

/**
 * Create Order Schema
 */
export const createOrderSchema = z.object({
  intent: z.enum(['CAPTURE', 'AUTHORIZE']),
  purchase_units: z.array(
    z.object({
      amount: amountSchema,
      description: z.string().optional(),
      reference_id: z.string().optional(),
      items: z.array(
        z.object({
          name: z.string().min(1, 'Item name is required'),
          quantity: z.string().regex(/^\d+$/, 'Quantity must be a positive integer'),
          unit_amount: amountSchema,
          description: z.string().optional(),
        })
      ).optional(),
    })
  ).min(1, 'At least one purchase unit is required'),
  application_context: z.object({
    brand_name: z.string().optional(),
    shipping_preference: z.enum(['GET_FROM_FILE', 'NO_SHIPPING', 'SET_PROVIDED_ADDRESS']).optional(),
    user_action: z.enum(['CONTINUE', 'PAY_NOW']).optional(),
  }).optional(),
});

/**
 * Capture Order Schema
 */
export const captureOrderSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  payment_source: z.object({
    token: z.object({
      id: z.string(),
      type: z.string(),
    }).optional(),
  }).optional(),
});

/**
 * Create Payment Schema
 */
export const createPaymentSchema = z.object({
  intent: z.string().min(1, 'Intent is required'),
  payer: z.object({
    payment_method: z.string().min(1, 'Payment method is required'),
    funding_instruments: z.array(
      z.object({
        credit_card: z.object({
          number: z.string().regex(/^\d{13,19}$/, 'Card number must be between 13 and 19 digits'),
          type: z.string().min(1, 'Card type is required'),
          expire_month: z.number().int().min(1).max(12),
          expire_year: z.number().int().min(2000),
          cvv2: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
          first_name: z.string().min(1, 'First name is required'),
          last_name: z.string().min(1, 'Last name is required'),
        }).optional(),
      })
    ).optional(),
  }),
  transactions: z.array(
    z.object({
      amount: z.object({
        total: z.string().regex(/^\d+\.?\d*$/, 'Must be a valid currency amount'),
        currency: currencyCodeSchema,
      }),
      description: z.string().optional(),
    })
  ).min(1, 'At least one transaction is required'),
});

/**
 * Create Subscription Schema
 */
export const createSubscriptionSchema = z.object({
  plan_id: z.string().min(1, 'Plan ID is required'),
  subscriber: z.object({
    name: z.object({
      given_name: z.string().min(1, 'Given name is required'),
      surname: z.string().min(1, 'Surname is required'),
    }),
    email_address: z.string().email('Must be a valid email address'),
  }),
  application_context: z.object({
    brand_name: z.string().optional(),
    shipping_preference: z.enum(['GET_FROM_FILE', 'NO_SHIPPING', 'SET_PROVIDED_ADDRESS']).optional(),
    user_action: z.enum(['CONTINUE', 'SUBSCRIBE_NOW']).optional(),
    payment_method: z.object({
      payer_selected: z.string().optional(),
      payee_preferred: z.string().optional(),
    }).optional(),
  }).optional(),
});

/**
 * Export all payment schemas
 */
export const paymentSchemas = {
  createPaymentTokenSchema,
  createOrderSchema,
  captureOrderSchema,
  createPaymentSchema,
  createSubscriptionSchema,
};
