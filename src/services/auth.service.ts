/**
 * PayPal Authentication Service
 * 
 * Handles OAuth 2.0 authentication with PayPal API, including token management
 * and automatic token refresh.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { sanitizeForLogging } from '../utils/validation.js';

/**
 * Authentication options
 */
export interface PayPalAuthOptions {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

/**
 * Token response from PayPal
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
  scope: string;
  expiration?: number; // Added for tracking expiration
}

/**
 * PayPal Authentication Service
 */
export class PayPalAuthService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private httpClient: AxiosInstance;
  private tokenData: TokenResponse | null = null;
  private tokenExpiryBuffer = 300; // 5 minutes buffer before expiration

  /**
   * Constructor
   */
  constructor(options: PayPalAuthOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.baseUrl = options.environment === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    // Create HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      response => response,
      error => this.handleRequestError(error)
    );
  }

  /**
   * Get the base URL for PayPal API
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get an authenticated HTTP client
   */
  async getAuthenticatedClient(): Promise<AxiosInstance> {
    await this.ensureAccessToken();
    
    const client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.tokenData?.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    client.interceptors.response.use(
      response => response,
      error => this.handleRequestError(error)
    );

    return client;
  }

  /**
   * Verify PayPal credentials by attempting to get a token
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      await this.getAccessToken();
      logger.info('PayPal credentials verified successfully');
      return true;
    } catch (error) {
      logger.error('Failed to verify PayPal credentials:', error);
      throw new Error('Invalid PayPal credentials. Please check your client ID and secret.');
    }
  }

  /**
   * Ensure we have a valid access token
   */
  async ensureAccessToken(): Promise<string> {
    // If we have a token and it's not expired (with buffer), return it
    if (this.tokenData && this.tokenData.expiration && 
        Date.now() < this.tokenData.expiration - (this.tokenExpiryBuffer * 1000)) {
      return this.tokenData.access_token;
    }

    // Otherwise, get a new token
    return this.getAccessToken();
  }

  /**
   * Get a new access token from PayPal
   */
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await this.httpClient.post<TokenResponse>('/v1/oauth2/token', 
        'grant_type=client_credentials', 
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Add expiration timestamp
      this.tokenData = {
        ...response.data,
        expiration: Date.now() + (response.data.expires_in * 1000),
      };

      logger.debug('Obtained new PayPal access token');
      return this.tokenData.access_token;
    } catch (error) {
      logger.error('Failed to obtain PayPal access token:', error);
      throw new Error('Failed to authenticate with PayPal API');
    }
  }

  /**
   * Handle request errors
   */
  private handleRequestError(error: any): Promise<never> {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      // Log the error details
      logger.error('PayPal API error:', {
        status,
        data: sanitizeForLogging(data),
        url: error.config?.url,
        method: error.config?.method,
      });

      // Handle specific error cases
      if (status === 401) {
        // Token might be expired, clear it to force refresh on next request
        this.tokenData = null;
        return Promise.reject(new Error('Authentication failed with PayPal API. Token may have expired.'));
      }

      if (data && data.error_description) {
        return Promise.reject(new Error(`PayPal API error: ${data.error_description}`));
      }

      if (data && data.message) {
        return Promise.reject(new Error(`PayPal API error: ${data.message}`));
      }
    }

    // Generic error handling
    logger.error('Unexpected error in PayPal API request:', error);
    return Promise.reject(error);
  }
}
