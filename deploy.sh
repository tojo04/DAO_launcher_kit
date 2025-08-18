#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting DAO deployment..."

# Stop and clean
dfx stop
rm -rf .dfx

# Start dfx
echo "📦 Starting Internet Computer replica..."
dfx start --clean --background
sleep 3

# Deploy base canisters
echo "🏗️ Deploying base canisters..."
dfx deploy dao_backend
dfx deploy staking

# Deploy governance with initialization
echo "🏛️ Deploying governance canister..."
DAO_BACKEND_ID=$(dfx canister id dao_backend)
STAKING_ID=$(dfx canister id staking)
dfx deploy governance --argument "(principal \"${DAO_BACKEND_ID}\", principal \"${STAKING_ID}\")"

# Deploy remaining canisters
echo "💎 Deploying remaining components..."
dfx deploy treasury
dfx deploy proposals
dfx deploy assets
dfx deploy internet_identity

# Initialize DAO backend
echo "⚙️ Initializing DAO backend..."
CALLER_PRINCIPAL=$(dfx identity get-principal)
dfx canister call dao_backend initialize "(\"${DAO_BACKEND_ID}\", \"Local Development DAO\", \"A DAO for local development and testing\", vec {})"

# Initialize proposals canister
echo "⚙️ Initializing proposals canister..."
dfx canister call proposals init "(principal \"${STAKING_ID}\")"

# Generate declarations and build frontend
echo "🔨 Building frontend..."
dfx generate dao_backend
dfx generate governance  
dfx generate staking
dfx generate treasury
dfx generate proposals
dfx generate assets
dfx generate internet_identity

cd src/dao_frontend
npm install
npm run build
cd ../..

# Deploy frontend
echo "🌐 Deploying frontend..."
dfx deploy dao_frontend

# Generate frontend declarations after deployment
dfx generate dao_frontend

# Update environment
echo "⚙️ Updating environment variables..."
./update-env.sh > /dev/null

echo "✨ Deployment complete!"
echo "Frontend: http://localhost:4943/?canisterId=$(dfx canister id dao_frontend)"
echo "Dev server: cd src/dao_frontend && npm run dev"
