# Use Node.js 18
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies using lockfile for faster, deterministic builds
RUN npm ci --include=dev

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