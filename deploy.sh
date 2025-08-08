#!/bin/bash

echo "🚀 Starting deployment of both entry points from deploy-version branch..."

# Clean up any existing build directories
echo "🧹 Cleaning up build directories..."
rm -rf build build-bib

# Build default version
echo "📦 Building default version..."
REACT_APP_FLOW_TYPE=default npm run build

# Build bib-route version
echo "📦 Building bib-route version..."
REACT_APP_FLOW_TYPE=bib_route npm run build
mv build build-bib

# Rebuild default version (since build folder was moved)
echo "📦 Rebuilding default version..."
REACT_APP_FLOW_TYPE=default npm run build

# Deploy to Firebase
echo "🌐 Deploying to Firebase..."

# Deploy default version
echo "📍 Deploying default version..."
firebase deploy --only hosting:default

# Deploy bib-route version
echo "📍 Deploying bib-route version..."
firebase deploy --only hosting:bib-route

echo "✅ Deployment complete!"
echo ""
echo "🌍 URLs:"
echo "Default: https://sydney-marathon-2025.web.app"
echo "BIB Route: https://bib-route-sydney-marathon-2025.web.app"
echo ""
echo "📋 To set up custom domains:"
echo "1. Go to Firebase Console > Hosting"
echo "2. Add custom domain for each target"
echo "3. Update DNS records as instructed"
