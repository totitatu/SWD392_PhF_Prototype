# =========================
# Stage 1: Build (Maven)
# =========================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

# SSL + DNS tools for reliable dependency download
RUN apk add --no-cache \
    ca-certificates \
    openssl \
    bind-tools \
    busybox-extras \
    musl-utils \
 && update-ca-certificates \
 && printf "hosts: files dns\n" > /etc/nsswitch.conf

WORKDIR /app

# Copy pom for better caching
COPY pom.xml ./

# Prime dependencies (tăng độ bền mạng, không fail build nếu mirror hơi chậm)
RUN mvn -B -q dependency:go-offline \
    -Dmaven.wagon.http.retryHandler.count=3 \
    -Dmaven.wagon.httpconnectionManager.ttlSeconds=120 \
 || echo "Warning: Some dependencies may not be cached"

# Copy source
COPY src ./src

# Build app (skip tests để nhanh)
RUN mvn -B -q clean package -DskipTests \
    -Dmaven.test.skip=true \
    -Dmaven.compile.fork=true \
    -Dmaven.wagon.http.retryHandler.count=3 \
    -Dmaven.wagon.httpconnectionManager.ttlSeconds=120 \
 && rm -rf /root/.m2

# =========================
# Stage 2: Runtime (JRE)
# =========================
FROM eclipse-temurin:17-jre-alpine

# Cài công cụ mạng + CA + nsswitch cho DNS chuẩn
RUN apk add --no-cache \
    ca-certificates \
    bind-tools \
    netcat-openbsd \
    iputils \
    busybox-extras \
    musl-utils \
    curl \
    wget \
    openssl \
    tzdata \
 && update-ca-certificates \
 && printf "hosts: files dns\n" > /etc/nsswitch.conf \
 && printf "precedence ::ffff:0:0/96  100\n" > /etc/gai.conf \
 && rm -rf /var/cache/apk/*

# Clear proxy trong image để tránh JVM pick up
ENV HTTP_PROXY="" \
    HTTPS_PROXY="" \
    ALL_PROXY="" \
    NO_PROXY=".supabase.co,localhost,127.0.0.1" \
    TZ=UTC \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# Non-root user
RUN addgroup -S spring && adduser -S spring -G spring
WORKDIR /app

# Copy app and startup script
COPY --from=builder /app/target/*.jar app.jar
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Ownership
RUN chown spring:spring app.jar /start.sh

USER spring:spring
EXPOSE 8080

# Healthcheck (dùng wget, đã cài)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD wget --no-verbose --tries=3 --timeout=5 --spider http://localhost:8080/actuator/health 2>/dev/null \
   || wget --no-verbose --tries=3 --timeout=5 --spider http://localhost:8080/ 2>/dev/null \
   || exit 1

# Use startup script to resolve IP and start Java
ENTRYPOINT ["/start.sh"]
