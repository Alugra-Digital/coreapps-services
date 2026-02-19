#!/bin/bash
set -e

echo "🚀 Installing K3s Kubernetes..."

# Install K3s with Traefik DISABLED (we use Nginx on the host instead)
curl -sfL https://get.k3s.io | sh -s - \
  --write-kubeconfig-mode 644 \
  --disable traefik \
  --disable servicelb \
  --node-label role=master

echo "✅ K3s installed successfully"

# Wait for K3s to be ready
echo "⏳ Waiting for K3s to be ready..."
sleep 15

# Check K3s status
sudo systemctl status k3s --no-pager || true

echo "📝 Setting up kubeconfig..."
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config

echo "✅ Kubeconfig configured"

# Verify cluster is up
echo "🔍 Verifying cluster..."
kubectl get nodes
kubectl get pods -A

echo ""
echo "🎉 K3s cluster setup complete!"
echo ""
echo "Next steps:"
echo "  1. Build and deploy: ./k8s/scripts/deploy.sh"
echo "  2. Configure Nginx:  sudo cp k8s/nginx/erp.alugra.dev.conf /etc/nginx/sites-available/"
echo "                       sudo ln -s /etc/nginx/sites-available/erp.alugra.dev.conf /etc/nginx/sites-enabled/"
echo "                       sudo nginx -t && sudo systemctl reload nginx"
echo "  3. Get SSL cert:     sudo certbot --nginx -d erp.alugra.dev"
