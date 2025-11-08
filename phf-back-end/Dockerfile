# Multi-stage build for Spring Boot application - Optimized
# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml ./

# Copy Maven wrapper files if they exist (optional, Maven image already has Maven)
# COPY mvnw mvnw.cmd ./
# COPY .mvn ./.mvn

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:go-offline -B || true

# Copy source code
COPY src ./src

# Build the application with optimizations
# - Skip tests for faster builds
# - Create reproducible builds
# - Optimize for production
RUN mvn clean package -DskipTests -B \
    -Dmaven.test.skip=true \
    -Dmaven.compile.fork=true \
    && rm -rf /root/.m2

# Stage 2: Runtime stage - Using JRE slim for smaller image
FROM eclipse-temurin:17-jre-alpine

# Install necessary packages including network tools for debugging
RUN apk add --no-cache \
    wget \
    tzdata \
    bind-tools \
    netcat-openbsd \
    iputils \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy the JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8080

# Health check (increased start-period to allow database connection)
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health 2>/dev/null || \
      wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Run the application with optimized JVM settings
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-XX:MaxGCPauseMillis=200", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-XX:+HeapDumpOnOutOfMemoryError", \
  "-XX:HeapDumpPath=/tmp/heapdump.hprof", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.backgroundpreinitializer.ignore=true", \
  "-Dfile.encoding=UTF-8", \
  "-jar", \
  "app.jar"]
