#!/bin/bash

set -e  # Exit on error
set -x  # Print commands for debugging

echo "🚀 Starting DAO deployment..."

# Stop any running dfx instances and clean state
dfx stop
rm -rf .dfx

# Start dfx in the background
echo "📦 Starting Internet Computer replica..."
dfx start --clean --background

sleep 5

# Deploy base canisters first (no dependencies)
echo "🏗️ Deploying base canisters..."
dfx deploy dao_backend
dfx deploy staking

# Get and verify canister IDs
DAO_BACKEND_ID=$(dfx canister id dao_backend)
STAKING_ID=$(dfx canister id staking)

echo "Debug: DAO Backend ID: ${DAO_BACKEND_ID}"
echo "Debug: Staking ID: ${STAKING_ID}"

# Format the initialization argument carefully
INIT_ARG="(principal \"${DAO_BACKEND_ID}\", principal \"${STAKING_ID}\")"
echo "Debug: Init argument: ${INIT_ARG}"

# Deploy governance with initialization arguments
echo "🏛️ Deploying governance canister..."
dfx deploy governance --argument "${INIT_ARG}" || {
    echo "❌ Governance canister deployment failed"
    dfx canister status governance
    exit 1
}

# Deploy remaining backend canisters
echo "💎 Deploying remaining backend components..."
dfx deploy treasury
dfx deploy proposals
dfx deploy assets

# Deploy Internet Identity canister
echo "🔐 Deploying Internet Identity..."
dfx deploy internet_identity

# Generate type declarations for backend canisters only (before frontend)
echo "📋 Generating backend type declarations..."
dfx generate dao_backend
dfx generate governance  
dfx generate staking
dfx generate treasury
dfx generate proposals
dfx generate assets
dfx generate internet_identity

# Wait a moment for file system to sync
sleep 2

# Copy declarations to frontend location for build
echo "📋 Copying declarations to frontend location..."
mkdir -p src/dao_frontend/src/declarations
rm -rf src/dao_frontend/src/declarations/*
cp -r src/declarations/* src/dao_frontend/src/declarations/

# Verify critical files exist
if [ ! -f "src/dao_frontend/src/declarations/dao_backend/dao_backend.did.js" ]; then
    echo "❌ Critical declaration file missing, retrying copy..."
    sleep 1
    cp -r src/declarations/* src/dao_frontend/src/declarations/
fi

# Clear Vite cache to ensure fresh build
echo "🧹 Clearing Vite cache..."
rm -rf src/dao_frontend/node_modules/.vite

# Build frontend with generated declarations
echo "🔨 Building frontend..."
cd src/dao_frontend
npm install
npm run build
cd ../..

# Deploy frontend canister
echo "🌐 Deploying frontend..."
dfx deploy dao_frontend

# Generate all declarations (including frontend)
echo "📋 Generating all type declarations..."
dfx generate

# Generate environment variables for frontend
echo "⚙️ Updating frontend environment variables..."
./update-env.sh > /dev/null

echo "✨ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Frontend will be available at: http://localhost:4943/?canisterId=$(dfx canister id dao_frontend)"
echo "2. Start frontend development server: cd src/dao_frontend && npm run dev"
echo "3. Environment variables have been generated in .env"