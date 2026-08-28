# Build stage: uses the intermediate maven-deps image
# Build the intermediate image first:
#   docker build -t restaurant-maven-deps:latest -f dockerfile.maven .
# Then build this Dockerfile as usual via docker-compose or:
#   docker build -t restaurant-backend:latest -f Dockerfile .
FROM restaurant-maven-deps:latest AS build

WORKDIR /app

# Copy only the source code (dependencies are already in /root/.m2
# from the intermediate image's pre-downloaded layer)
COPY src src

# Build the application - Maven uses the cached dependencies
# from the intermediate image (~/.m2). If any transitive dependencies
# are missing, Maven downloads them online (the -o flag is not used).
# The intermediate image is rebuilt only when pom.xml changes.
RUN mvn clean package -DskipTests

# --- Runtime stage ---
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/restaurant-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Use exec form for proper signal handling
ENTRYPOINT ["java", "-jar", "app.jar"]