# Use Node.js 20 (required for Ant Design Pro v6)
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy peer deps for compatibility
RUN npm ci --include=dev --legacy-peer-deps

# Copy source code
COPY . .

# Build the application (avoid cache conflicts)
RUN npm run build

# Clean up node_modules to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]