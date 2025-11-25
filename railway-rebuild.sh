#!/bin/bash

# Railway Force Rebuild Script
echo "🚂 Force rebuilding Railway deployment..."

# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Build project
npm run build

echo "✅ Local build successful! Ready for Railway deployment."