# Build stage: uses the project's own Maven wrapper
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy the notification-service project and build it
COPY pom.xml .
COPY src src

RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=build /app/target/notification-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]