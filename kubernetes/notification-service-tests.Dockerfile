# Image that bundles the notification-service source code on top of
# a Maven runtime so a Kubernetes Job can run the unit tests.
#
# Build from the repository root:
#   docker build -t restaurant-notification-service-tests:local \
#     -f kubernetes/notification-service-tests.Dockerfile .
FROM maven:3.9-eclipse-temurin-17-alpine
WORKDIR /src
COPY notification-service/ /src/
CMD ["mvn", "-B", "test"]
