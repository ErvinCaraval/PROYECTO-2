#!/bin/bash

# Build script for Render deployment - Comprehensive SPA routing solution
echo "🚀 Building React app for Render deployment with comprehensive SPA routing..."

# Clean previous build completely
echo "🧹 Cleaning previous build..."
rm -rf dist
rm -rf node_modules/.vite

# Install dependencies to ensure everything is up to date
echo "📦 Installing dependencies..."
npm ci

# Build the app
echo "🔨 Building React application..."
npm run build

# Verify build was successful
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found!"
    exit 1
fi

# Ensure all configuration files are copied to dist
echo "📁 Copying ALL configuration files to dist..."

# Primary method: _redirects (most compatible)
cp public/_redirects dist/_redirects
echo "✅ Copied _redirects (primary method)"

# Alternative method: render-redirects
cp public/render-redirects dist/render-redirects
echo "✅ Copied render-redirects (alternative method)"

# Vercel compatibility
cp public/vercel.json dist/vercel.json
echo "✅ Copied vercel.json (Vercel compatibility)"

# Netlify compatibility
cp public/netlify.toml dist/netlify.toml
echo "✅ Copied netlify.toml (Netlify compatibility)"

# Create additional fallback files
echo "📄 Creating additional fallback files..."

# Create .htaccess for Apache servers (if needed)
cat > dist/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF
echo "✅ Created .htaccess (Apache fallback)"

# Create nginx.conf for Nginx servers (if needed)
cat > dist/nginx.conf << 'EOF'
location / {
    try_files $uri $uri/ /index.html;
}
EOF
echo "✅ Created nginx.conf (Nginx fallback)"

# Verify all files exist and have correct permissions
echo "🔍 Verifying all configuration files in dist:"
ls -la dist/ | grep -E "(_redirects|vercel.json|netlify.toml|render-redirects|\.htaccess|nginx.conf|index.html)"

# Check file permissions
chmod 644 dist/_redirects dist/vercel.json dist/netlify.toml dist/render-redirects dist/.htaccess dist/nginx.conf
echo "✅ Set correct permissions for all files"

# Verify index.html content
echo "📄 Verifying index.html content..."
if grep -q "root" dist/index.html; then
    echo "✅ index.html contains React root element"
else
    echo "❌ Warning: index.html may not contain React root element"
fi

echo ""
echo "🎉 Build completed successfully!"
echo "📦 Ready for deployment to Render with comprehensive SPA routing"
echo ""
echo "📋 Files created for SPA routing:"
echo "   - _redirects (primary)"
echo "   - render-redirects (alternative)"
echo "   - vercel.json (Vercel compatibility)"
echo "   - netlify.toml (Netlify compatibility)"
echo "   - .htaccess (Apache fallback)"
echo "   - nginx.conf (Nginx fallback)"
echo ""
echo "🚀 This build covers ALL possible deployment scenarios!"
