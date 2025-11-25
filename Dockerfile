# Use Node.js 20 Debian (better compatibility for Mako bundler)
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy peer deps for compatibility
RUN npm ci --include=dev --legacy-peer-deps

# Install Mako native binary explicitly (optional dependency)
RUN npm install @umijs/mako-linux-x64-gnu --no-save || true

# Copy source code
COPY . .

# Build the application (avoid cache conflicts)
RUN npm run build

# Remove devDependencies but keep production dependencies (express, cors, etc)
# Note: Don't prune - we need express and other server dependencies
# RUN npm prune --production

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