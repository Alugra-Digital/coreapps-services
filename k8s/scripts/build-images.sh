#!/bin/bash
# build-images.sh – Build all Docker images and import them into k3s
# Run this on the VPS where k3s is installed.
#
# Usage:
#   chmod +x k8s/scripts/build-images.sh
#   ./k8s/scripts/build-images.sh [--tag v1.0.0]
set -e

TAG=${1:-latest}
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "🏗️  Building CoreApps ERP Docker images (tag: ${TAG})"
echo "📁 Project root: ${ROOT_DIR}"
echo ""

# List of services: [image-name]:[service-directory]
declare -A SERVICES=(
  ["coreapps-gateway"]="services/gateway"
  ["coreapps-auth-service"]="services/auth-service"
  ["coreapps-crm-service"]="services/crm-service"
  ["coreapps-finance-service"]="services/finance-service"
  ["coreapps-hr-service"]="services/hr-service"
  ["coreapps-inventory-service"]="services/inventory-service"
  ["coreapps-accounting-service"]="services/accounting-service"
  ["coreapps-analytics-service"]="services/analytics-service"
  ["coreapps-notification-service"]="services/notification-service"
  ["coreapps-manufacturing-service"]="services/manufacturing-service"
  ["coreapps-asset-service"]="services/asset-service"
)

for IMAGE_NAME in "${!SERVICES[@]}"; do
  SERVICE_DIR="${SERVICES[$IMAGE_NAME]}"
  FULL_PATH="${ROOT_DIR}/${SERVICE_DIR}"

  if [ ! -d "$FULL_PATH" ]; then
    echo "⚠️  Skipping ${IMAGE_NAME}: directory ${FULL_PATH} not found"
    continue
  fi

  echo "🔨 Building ${IMAGE_NAME}:${TAG}..."
  docker build \
    -t "${IMAGE_NAME}:${TAG}" \
    -f "${FULL_PATH}/Dockerfile" \
    "${FULL_PATH}"

  echo "📦 Importing ${IMAGE_NAME}:${TAG} into k3s..."
  docker save "${IMAGE_NAME}:${TAG}" | sudo k3s ctr images import -

  echo "✅ ${IMAGE_NAME}:${TAG} ready"
  echo ""
done

echo "🎉 All images built and imported into k3s!"
echo ""
echo "Next: run ./k8s/scripts/deploy.sh to deploy to the cluster"
