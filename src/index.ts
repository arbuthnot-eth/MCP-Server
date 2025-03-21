#!/usr/bin/env node
/**
 * PayPal MCP Server
 * 
 * A Model Context Protocol (MCP) server that provides integration with PayPal's APIs.
 * This server enables seamless interaction with PayPal's payment processing, invoicing,
 * subscription management, and business operations through a standardized interface.
 *
 * @author PayPal-MCP Contributors
 * @license MIT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import services and utilities
import { PayPalAuthService } from './services/auth.service.js';
import { validateInput } from './utils/validation.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';

// Import tool handlers
import { paymentTools } from './tools/payment.tools.js';
import { businessTools } from './tools/business.tools.js';
import { userTools } from './tools/user.tools.js';

/**
 * Main PayPal MCP Server class
 */
class PayPalMcpServer {
  private server: Server;
  private authService: PayPalAuthService;

  constructor() {
    // Initialize the MCP server
    this.server = new Server(
      {
        name: 'paypal-mcp-server',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize the PayPal authentication service
    this.authService = new PayPalAuthService({
      clientId: config.paypal.clientId,
      clientSecret: config.paypal.clientSecret,
      environment: config.paypal.environment,
    });

    // Set up request handlers
    this.setupRequestHandlers();
    
    // Set up error handling
    this.setupErrorHandling();
  }

  /**
   * Set up MCP request handlers
   */
  private setupRequestHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const allTools = [
        ...paymentTools,
        ...businessTools,
        ...userTools,
      ];

      return {
        tools: allTools,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Tool call: ${name}`);
      logger.debug(`Tool arguments: ${JSON.stringify(args)}`);

      try {
        // Ensure we have a valid access token
        await this.authService.ensureAccessToken();
        
        // Find the appropriate handler based on the tool name
        const handler = this.getToolHandler(name);
        
        if (!handler) {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        // Validate the input arguments
        const validatedArgs = validateInput(name, args);
        
        // Execute the tool handler
        const result = await handler(validatedArgs, this.authService);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        logger.error(`Error executing tool ${name}:`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Get the appropriate tool handler function
   */
  private getToolHandler(toolName: string): Function | undefined {
    // Check payment tools
    const paymentHandler = paymentTools.find(tool => tool.name === toolName)?.handler;
    if (paymentHandler) return paymentHandler;

    // Check business tools
    const businessHandler = businessTools.find(tool => tool.name === toolName)?.handler;
    if (businessHandler) return businessHandler;

    // Check user tools
    const userHandler = userTools.find(tool => tool.name === toolName)?.handler;
    if (userHandler) return userHandler;

    return undefined;
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('MCP Server Error:', error);
    };

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('SIGINT', async () => {
      logger.info('Shutting down PayPal MCP server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    try {
      // Verify PayPal credentials on startup
      await this.authService.verifyCredentials();
      
      // Connect to the transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info(`PayPal MCP server running on ${config.paypal.environment} environment`);
    } catch (error) {
      logger.error('Failed to start PayPal MCP server:', error);
      process.exit(1);
    }
  }
}

// Create and run the server
const server = new PayPalMcpServer();
server.run().catch((error) => {
  logger.error('Error running PayPal MCP server:', error);
  process.exit(1);
});
