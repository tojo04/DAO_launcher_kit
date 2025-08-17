#!/bin/bash

echo "🔧 Fixing frontend declarations..."

# Copy declarations from project root to frontend
echo "📋 Copying declarations..."
mkdir -p src/dao_frontend/src/declarations
rm -rf src/dao_frontend/src/declarations/*
cp -r src/declarations/* src/dao_frontend/src/declarations/

# Verify the copy worked
if [ -f "src/dao_frontend/src/declarations/dao_backend/dao_backend.did.js" ]; then
    echo "✅ Declarations copied successfully"
else
    echo "❌ Declaration copy failed"
    exit 1
fi

# Clear Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf src/dao_frontend/node_modules/.vite

echo "✨ Fix complete! Restart your frontend dev server with: cd src/dao_frontend && npm run dev"
