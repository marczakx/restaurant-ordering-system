#!/usr/bin/env bash
# Run all unit-test Kubernetes Jobs against a target cluster and
# wait for them to finish. Exits non-zero on the first failure.
#
# Usage:
#   scripts/run-unit-tests-k8s.sh <kubectl-context>
#
# Image tags are derived from VERSION + git short hash, so the
# script always uses the same tag the Job manifests reference.
# The Jobs use public marczakx/* images, so the script works on
# any cluster that can pull from Docker Hub.
set -euo pipefail

CTX="${1:-minikube}"
NS="restaurant"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

VERSION="$(tr -d '[:space:]' < "${ROOT_DIR}/VERSION")"
COMMIT="$(git -C "${ROOT_DIR}" rev-parse --short HEAD)"
TAG="${VERSION}-${COMMIT}"
echo ">>> Using image tag: ${TAG}  (context='${CTX}', namespace='${NS}')"

# Substitute the placeholder in the rendered Job manifest with the
# current tag, then apply.  This keeps the manifest files stable while
# letting the tag follow VERSION and the current commit.
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Per-Job timeout. The frontend test image is ~5GB compressed and may
# take 20-30 minutes to pull on a cold minikube cache, so the frontend
# timeout is larger than the Java services.
declare -A TIMEOUTS=(
  [auth-service-tests]=15m
  [notification-service-tests]=15m
  [frontend-unit-tests]=60m
)
JOBS=(
  "kubernetes/auth-service-tests-job.yaml"
  "kubernetes/notification-service-tests-job.yaml"
  "kubernetes/frontend-unit-tests-job.yaml"
)

# Delete any prior runs so backoffLimit:0 + ttlSecondsAfterFinished
# does not cause false positives.
for f in "${JOBS[@]}"; do
  name=$(basename "$f" -job.yaml)
  kubectl --context "$CTX" -n "$NS" delete job "$name" --ignore-not-found=true >/dev/null
done

PASS=0
FAIL=0
for f in "${JOBS[@]}"; do
  name=$(basename "$f" -job.yaml)
  rendered="$TMP_DIR/${name}.yaml"
  # Allow either ":<TAG>" (preferred) or ":<commit>" as the placeholder.
  sed -E "s#(marczakx/restaurant-[a-z-]+):[A-Za-z0-9._-]+#\\1:${TAG}#g" \
      "$ROOT_DIR/$f" > "$rendered"
  echo ">>> Applying $name (image tag $TAG)"
  kubectl --context "$CTX" -n "$NS" apply -f "$rendered" >/dev/null
  if kubectl --context "$CTX" -n "$NS" wait \
        --for=condition=complete \
        --timeout="${TIMEOUTS[$name]:-30m}" \
        "job/$name" 2>/dev/null; then
    echo ">>> $name PASSED"
    PASS=$((PASS+1))
  else
    echo ">>> $name FAILED"
    kubectl --context "$CTX" -n "$NS" logs "job/$name" || true
    FAIL=$((FAIL+1))
  fi
done

echo "==============================="
echo "PASS: $PASS  FAIL: $FAIL"
echo "==============================="
[ "$FAIL" -eq 0 ]
