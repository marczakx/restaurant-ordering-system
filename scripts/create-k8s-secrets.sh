#!/usr/bin/env bash
#
# Create the google-oauth Secret in the Kubernetes cluster from the local
# secrets file. The file lives OUTSIDE the repository so credentials are
# never committed.
#
# Usage:
#   ./scripts/create-k8s-secrets.sh
#
# Environment overrides:
#   NAMESPACE     target namespace            (default: restaurant)
#   SECRETS_FILE  path to the secrets file    (default: ~/.config/restaurant/secrets.env)
#
set -euo pipefail

NAMESPACE="${NAMESPACE:-restaurant}"
SECRETS_FILE="${SECRETS_FILE:-$HOME/.config/restaurant/secrets.env}"

if [[ ! -f "${SECRETS_FILE}" ]]; then
  echo "ERROR: secrets file not found: ${SECRETS_FILE}" >&2
  echo "Create it first (values come from https://console.cloud.google.com/apis/credentials):" >&2
  echo "" >&2
  echo "  mkdir -p ~/.config/restaurant" >&2
  echo "  cat > ~/.config/restaurant/secrets.env <<'EOF'" >&2
  echo "GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com" >&2
  echo "GOOGLE_CLIENT_SECRET=GOCSPX-<your-secret>" >&2
  echo "EOF" >&2
  exit 1
fi

# Make sure the namespace exists before creating the secret in it.
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# Idempotent: re-running updates the existing Secret instead of failing.
kubectl create secret generic google-oauth -n "${NAMESPACE}" \
  --from-env-file "${SECRETS_FILE}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Secret 'google-oauth' applied in namespace '${NAMESPACE}'."
echo "==> Restart the backend so its pod picks up the values:"
echo "    kubectl rollout restart deploy/restaurant-backend -n ${NAMESPACE}"