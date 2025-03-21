/**
 * User tools for PayPal MCP Server
 * 
 * Implements user-related tools for the MCP server.
 */

import axios from 'axios';
import { PayPalAuthService } from '../services/auth.service.js';
import { logger } from '../utils/logger.js';
import { sanitizeForLogging } from '../utils/validation.js';

/**
 * Get User Info
 * 
 * Retrieve user information.
 */
async function getUserInfo(args: any, authService: PayPalAuthService) {
  const { access_token } = args;
  
  logger.info('Getting user info');
  logger.debug('User info args:', sanitizeForLogging(args));
  
  try {
    // For user info, we use the provided access token directly
    const response = await axios.get('https://api-m.paypal.com/v1/identity/oauth2/userinfo?schema=paypalv1.1', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error getting user info:', error);
    throw new Error('Failed to get user info: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Create Web Profile
 * 
 * Create a web experience profile.
 */
async function createWebProfile(args: any, authService: PayPalAuthService) {
  logger.info('Creating web profile');
  logger.debug('Web profile args:', sanitizeForLogging(args));
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.post('/v1/payment-experience/web-profiles', args);
    return response.data;
  } catch (error) {
    logger.error('Error creating web profile:', error);
    throw new Error('Failed to create web profile: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Get Web Profiles
 * 
 * Get list of web experience profiles.
 */
async function getWebProfiles(_args: any, authService: PayPalAuthService) {
  logger.info('Getting web profiles');
  
  const client = await authService.getAuthenticatedClient();
  
  try {
    const response = await client.get('/v1/payment-experience/web-profiles');
    return response.data;
  } catch (error) {
    logger.error('Error getting web profiles:', error);
    throw new Error('Failed to get web profiles: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * User tools definition
 */
export const userTools = [
  {
    name: 'get_userinfo',
    description: 'Retrieve user information',
    inputSchema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
      required: ['access_token'],
    },
    handler: getUserInfo,
  },
  {
    name: 'create_web_profile',
    description: 'Create a web experience profile',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        presentation: {
          type: 'object',
          properties: {
            brand_name: { type: 'string' },
            logo_image: { type: 'string' },
            locale_code: { type: 'string' },
          },
        },
        input_fields: {
          type: 'object',
          properties: {
            no_shipping: { type: 'number' },
            address_override: { type: 'number' },
          },
        },
        flow_config: {
          type: 'object',
          properties: {
            landing_page_type: { type: 'string' },
            bank_txn_pending_url: { type: 'string' },
          },
        },
      },
      required: ['name'],
    },
    handler: createWebProfile,
  },
  {
    name: 'get_web_profiles',
    description: 'Get list of web experience profiles',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: getWebProfiles,
  },
];
