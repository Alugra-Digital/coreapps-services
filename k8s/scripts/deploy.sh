#!/bin/bash
# deploy.sh – Full deploy of CoreApps ERP to k3s
#
# What this script does:
#   1. Builds and imports all Docker images into k3s
#   2. Creates/updates the Kubernetes Secret from .env
#   3. Applies the Kustomize production overlay
#   4. Waits for all deployments to roll out
#
# Usage:
#   chmod +x k8s/scripts/deploy.sh
#   ./k8s/scripts/deploy.sh [--skip-build] [--tag v1.0.0]
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SKIP_BUILD=false
TAG="latest"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --tag=*) TAG="${arg#*=}" ;;
  esac
done

echo "🚀 CoreApps ERP – k3s Deploy"
echo "📁 Root: ${ROOT_DIR}"
echo "🏷️  Tag: ${TAG}"
echo ""

# ─── Step 1: Build images ────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  echo "═══════════════════════════════════════"
  echo "  Step 1: Building Docker images"
  echo "═══════════════════════════════════════"
  bash "${ROOT_DIR}/k8s/scripts/build-images.sh" "${TAG}"
else
  echo "⏭️  Skipping image build (--skip-build)"
fi

# ─── Step 2: Ensure namespace exists ─────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "  Step 2: Ensuring namespace exists"
echo "═══════════════════════════════════════"
kubectl apply -f "${ROOT_DIR}/k8s/base/namespace.yaml"

# ─── Step 3: Create/update Kubernetes Secret from .env ───────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "  Step 3: Syncing secrets from .env"
echo "═══════════════════════════════════════"

ENV_FILE="${ROOT_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERROR: .env file not found at ${ENV_FILE}"
  exit 1
fi

# Delete existing secret (ignore error if it doesn't exist)
kubectl delete secret coreapps-secret -n coreapps --ignore-not-found

# Create secret from .env file (strips comments and blank lines)
kubectl create secret generic coreapps-secret \
  --from-env-file="${ENV_FILE}" \
  -n coreapps

echo "✅ Secret 'coreapps-secret' created in namespace 'coreapps'"

# ─── Step 4: Apply Kustomize overlay ─────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "  Step 4: Applying Kustomize overlay"
echo "═══════════════════════════════════════"
kubectl apply -k "${ROOT_DIR}/k8s/overlays/production"
echo "✅ Manifests applied"

# ─── Step 5: Wait for rollouts ───────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "  Step 5: Waiting for rollouts"
echo "═══════════════════════════════════════"

DEPLOYMENTS=(
  "gateway"
  "auth-service"
  "crm-service"
  "finance-service"
  "hr-service"
  "inventory-service"
  "accounting-service"
  "analytics-service"
  "notification-service"
  "manufacturing-service"
  "asset-service"
)

for DEPLOY in "${DEPLOYMENTS[@]}"; do
  echo "⏳ Waiting for ${DEPLOY}..."
  kubectl rollout status deployment/"${DEPLOY}" -n coreapps --timeout=120s
  echo "✅ ${DEPLOY} is ready"
done

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "  🎉 Deploy complete!"
echo "═══════════════════════════════════════"
echo ""
echo "Verify:"
echo "  kubectl get pods -n coreapps"
echo "  kubectl get svc -n coreapps"
echo ""
echo "Test gateway:"
echo "  curl http://localhost:3000/health"
echo "  curl http://localhost:3000/health/services"
echo ""
echo "View logs:"
echo "  kubectl logs -n coreapps deployment/gateway --tail=20"
echo "  kubectl logs -n coreapps deployment/hr-service --tail=20"
