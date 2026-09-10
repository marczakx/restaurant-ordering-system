#!/usr/bin/env bash
#
# Build the Cypress E2E runner image and execute the tests as a Kubernetes Job
# against the application running in the cluster.
#
# Usage:
#   ./scripts/run-e2e-k8s.sh
#
# Optional environment variables:
#   K8S_NAMESPACE     target namespace            (default: restaurant)
#   E2E_IMAGE         runner image name:tag       (default: marczakx/restaurant-e2e:<VERSION>)
#   CYPRESS_BASE_URL  URL under test              (default: http://nginx:80)
#
set -euo pipefail

NAMESPACE="${K8S_NAMESPACE:-restaurant}"
VERSION="$(tr -d '[:space:]' < "$(dirname "${BASH_SOURCE[0]}")/../VERSION")"
IMAGE="${E2E_IMAGE:-marczakx/restaurant-e2e:${VERSION}}"
BASE_URL="${CYPRESS_BASE_URL:-http://nginx:80}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "==> Building E2E runner image: ${IMAGE}"
docker build -t "${IMAGE}" -f "${ROOT_DIR}/front/Dockerfile.e2e" "${ROOT_DIR}/front"

# Load the image into a local cluster when one is detected
if command -v minikube >/dev/null 2>&1 && minikube status >/dev/null 2>&1; then
  echo "==> Loading image into minikube"
  minikube image load "${IMAGE}"
elif command -v kind >/dev/null 2>&1 && [ -n "$(kind get clusters 2>/dev/null)" ]; then
  KIND_CLUSTER="$(kind get clusters | head -n1)"
  echo "==> Loading image into kind cluster: ${KIND_CLUSTER}"
  kind load docker-image "${IMAGE}" --name "${KIND_CLUSTER}"
fi

echo "==> Applying E2E job in namespace '${NAMESPACE}'"
kubectl delete job e2e-tests -n "${NAMESPACE}" --ignore-not-found=true
kubectl apply -f "${ROOT_DIR}/kubernetes/e2e-tests-job.yaml" -n "${NAMESPACE}"

# Job pod templates are immutable, so the image and target URL cannot be patched
# after creation. Verify that the freshly created job matches the requested
# values instead of attempting an impossible in-place update.
JOB_IMAGE="$(kubectl get job e2e-tests -n "${NAMESPACE}" -o jsonpath='{.spec.template.spec.containers[?(@.name=="cypress")].image}')"
if [ "${JOB_IMAGE}" != "${IMAGE}" ]; then
  echo "ERROR: job image (${JOB_IMAGE}) differs from requested image (${IMAGE})." >&2
  echo "       Update kubernetes/e2e-tests-job.yaml or align E2E_IMAGE with the manifest." >&2
  exit 1
fi

JOB_URL="$(kubectl get job e2e-tests -n "${NAMESPACE}" -o jsonpath='{.spec.template.spec.containers[?(@.name=="cypress")].env[?(@.name=="CYPRESS_BASE_URL")].value}')"
if [ "${JOB_URL}" != "${BASE_URL}" ]; then
  echo "WARNING: CYPRESS_BASE_URL=${BASE_URL} requested but the job uses ${JOB_URL}." >&2
  echo "         Job pod templates are immutable - update kubernetes/e2e-tests-job.yaml." >&2
fi

echo "==> Waiting for the job to finish (this can take a few minutes)..."
if ! kubectl wait --for=condition=complete --timeout=15m job/e2e-tests -n "${NAMESPACE}"; then
  echo "==> E2E tests FAILED. Pod logs:"
  kubectl logs -l app=restaurant-e2e-tests -n "${NAMESPACE}" --tail=200 || true
  exit 1
fi

echo "==> E2E tests PASSED. Logs:"
kubectl logs -l app=restaurant-e2e-tests -n "${NAMESPACE}" --tail=200