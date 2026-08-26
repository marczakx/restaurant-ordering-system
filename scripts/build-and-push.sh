#!/usr/bin/env bash
#
# Build and push all application images to Docker Hub with version tags.
#
# Every image is tagged three times: the version from the VERSION file,
# the short git commit hash of the current HEAD, and `latest`.
# Kubernetes manifests reference the pinned version tag.
#
# Usage:
#   ./scripts/build-and-push.sh              # build & push all images
#   ./scripts/build-and-push.sh backend      # only backend
#   ./scripts/build-and-push.sh frontend     # only frontend (nginx + angular)
#   ./scripts/build-and-push.sh e2e          # only e2e runner
#
set -euo pipefail

DOCKER_USER="${DOCKER_USER:-marczakx}"
VERSION="$(tr -d '[:space:]' < "$(dirname "${BASH_SOURCE[0]}")/../VERSION")"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Short git commit hash used as an additional image tag so every push
# can be traced back to the exact source revision.
COMMIT="$(git -C "${ROOT_DIR}" rev-parse --short HEAD)"

build_and_push() {
  local name="$1" dockerfile="$2" context="$3"
  local image="${DOCKER_USER}/${name}"

  echo "==> Building ${image}:${VERSION} (commit ${COMMIT})"
  docker build -t "${image}:${VERSION}" -t "${image}:${COMMIT}" -t "${image}:latest" -f "${dockerfile}" "${context}"

  echo "==> Pushing ${image}:${VERSION}, ${image}:${COMMIT} and ${image}:latest"
  docker push "${image}:${VERSION}"
  docker push "${image}:${COMMIT}"
  docker push "${image}:latest"
}

TARGETS=("${@:-all}")
[[ " ${TARGETS[*]} " == *" all "* ]] && TARGETS=(backend frontend e2e)

for target in "${TARGETS[@]}"; do
  case "$target" in
    backend)
      # Backend requires the intermediate Maven dependencies image
      if ! docker image inspect restaurant-maven-deps:latest >/dev/null 2>&1; then
        echo "==> Building intermediate image restaurant-maven-deps:latest"
        docker build -t restaurant-maven-deps:latest -f "${ROOT_DIR}/dockerfile.maven" "${ROOT_DIR}"
      fi
      build_and_push "restaurant-backend" "${ROOT_DIR}/Dockerfile" "${ROOT_DIR}"
      ;;
    frontend)
      # Angular SPA tier
      build_and_push "restaurant-angular" "${ROOT_DIR}/front/Dockerfile.angular" "${ROOT_DIR}/front"
      # Nginx reverse-proxy tier (entry point, keeps the frontend name)
      build_and_push "restaurant-frontend" "${ROOT_DIR}/front/Dockerfile.nginx" "${ROOT_DIR}/front"
      ;;
    e2e)
      build_and_push "restaurant-e2e" "${ROOT_DIR}/front/Dockerfile.e2e" "${ROOT_DIR}/front"
      ;;
    *)
      echo "Unknown target: $target (expected: backend, frontend, e2e)" >&2
      exit 1
      ;;
  esac
done

echo "==> Done. Version: ${VERSION}, commit: ${COMMIT}"
