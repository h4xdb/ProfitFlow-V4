#!/bin/bash
echo "Building frontend..."
npx vite build

echo "Building production server..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

echo "Build completed successfully!"
echo "Frontend built to: dist/public/"
echo "Production server built to: dist/production.js"

echo ""
echo "To run in production:"
echo "NODE_ENV=production node dist/production.js"