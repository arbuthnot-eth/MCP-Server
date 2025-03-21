# Multi-stage build for PayPal MCP Server

# Stage 1: Build the TypeScript project
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the project
RUN npm run build

# Make the output executable
RUN chmod +x build/index.js

# Stage 2: Create the production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -S mcp && adduser -S mcp -G mcp

# Copy built files and dependencies from builder stage
COPY --from=builder --chown=mcp:mcp /app/build /app/build
COPY --from=builder --chown=mcp:mcp /app/node_modules /app/node_modules
COPY --from=builder --chown=mcp:mcp /app/package*.json /app/

# Environment variables (to be overridden at runtime)
ENV NODE_ENV=production
ENV PAYPAL_CLIENT_ID=
ENV PAYPAL_CLIENT_SECRET=
ENV PAYPAL_ENVIRONMENT=sandbox

# Switch to non-root user
USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD node -e "process.exit(0)"

# Command to run the MCP server
CMD ["node", "build/index.js"]
