# Image that bundles the auth-service source code on top of a Maven
# runtime so a Kubernetes Job can run the unit tests without needing
# to clone a git repository inside the pod.
#
# Build from the repository root:
#   docker build -t restaurant-auth-service-tests:local \
#     -f kubernetes/auth-service-tests.Dockerfile .
FROM maven:3.9-eclipse-temurin-17-alpine
WORKDIR /src
COPY auth-service/ /src/
CMD ["mvn", "-B", "test"]
