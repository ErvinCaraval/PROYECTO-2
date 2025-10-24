#!/bin/bash

# Build script for Render deployment
echo "🚀 Building React app for Render deployment..."

# Clean previous build
rm -rf dist

# Build the app
npm run build

# Ensure all configuration files are copied to dist
echo "📁 Copying configuration files to dist..."

# Copy _redirects file
cp public/_redirects dist/_redirects
echo "✅ Copied _redirects"

# Copy vercel.json
cp public/vercel.json dist/vercel.json
echo "✅ Copied vercel.json"

# Copy netlify.toml
cp public/netlify.toml dist/netlify.toml
echo "✅ Copied netlify.toml"

# Verify files exist
echo "🔍 Verifying configuration files in dist:"
ls -la dist/ | grep -E "(_redirects|vercel.json|netlify.toml)"

echo "✅ Build completed successfully!"
echo "📦 Ready for deployment to Render"
