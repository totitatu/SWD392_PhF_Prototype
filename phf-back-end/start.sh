#!/bin/sh
# Simple startup script to resolve IP and start Java app

DB_HOST="db.yekpjpfhkjaydufdzxgo.supabase.co"

# Resolve IPv4 address ONLY (force IPv4, ignore IPv6)
echo "Resolving database IPv4 address..."
DB_IP=""

# Try multiple DNS servers to get IPv4
DNS_SERVERS="8.8.8.8 1.1.1.1 8.8.4.4"

# Method 1: dig A record with specific DNS servers (most reliable)
if command -v dig >/dev/null 2>&1; then
    for dns in $DNS_SERVERS; do
        DB_IP=$(dig @$dns +short -4 "$DB_HOST" A 2>/dev/null | grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' | head -1)
        if [ -n "$DB_IP" ]; then
            echo "Resolved via DNS server $dns"
            break
        fi
    done
fi

# Method 2: nslookup with type A and specific DNS server
if [ -z "$DB_IP" ] && command -v nslookup >/dev/null 2>&1; then
    for dns in $DNS_SERVERS; do
        DB_IP=$(nslookup -type=A "$DB_HOST" $dns 2>/dev/null | grep -A 10 "Name:" | grep "Address" | awk '{print $2}' | grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' | head -1)
        if [ -n "$DB_IP" ]; then
            echo "Resolved via DNS server $dns"
            break
        fi
    done
fi

# Method 3: getent ahostsv4 (IPv4 only)
if [ -z "$DB_IP" ] && command -v getent >/dev/null 2>&1; then
    DB_IP=$(getent ahostsv4 "$DB_HOST" 2>/dev/null | awk '{print $1}' | grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' | head -1)
fi

# If we got IPv4, replace hostname in connection string
if [ -n "$DB_IP" ] && [ "$DB_IP" != "$DB_HOST" ]; then
    echo "✓ Database IPv4 resolved: $DB_IP"
    if [ -n "$SPRING_DATASOURCE_URL" ]; then
        export SPRING_DATASOURCE_URL=$(echo "$SPRING_DATASOURCE_URL" | sed "s|://$DB_HOST:|://$DB_IP:|g")
    else
        export SPRING_DATASOURCE_URL="jdbc:postgresql://$DB_IP:5432/postgres?sslmode=require&ApplicationName=phf-back-end&preferQueryMode=simple"
    fi
    echo "✓ Using IPv4 in connection string"
    TEST_HOST="$DB_IP"
else
    echo "✗ FATAL: Could not resolve IPv4 address for $DB_HOST"
    echo ""
    echo "Possible causes:"
    echo "  1. Supabase database only has IPv6 record (no IPv4)"
    echo "  2. DNS servers not returning IPv4 records"
    echo "  3. Network/DNS configuration issue"
    echo ""
    echo "Solutions:"
    echo "  1. Check if Supabase provides IPv4 endpoint"
    echo "  2. Remove IPv6 disable sysctls to allow IPv6 connections"
    echo "  3. Use direct IP address if available from Supabase dashboard"
    echo ""
    echo "Exiting to prevent connection failures..."
    exit 1
fi

# Test DNS and port connectivity before starting app
echo "Testing DNS (IPv4 only)..."
nslookup -type=A $DB_HOST || true
getent ahostsv4 $DB_HOST || true

echo "Testing port 5432..."
# Test port but don't fail if Supabase blocks raw TCP (SSL may still work)
if [ -n "$DB_IP" ] && [ "$DB_IP" != "$DB_HOST" ]; then
    # If we have IPv4, test with IP
    if ! nc -vz -4 "$DB_IP" 5432 >/dev/null 2>&1; then
        echo "WARNING: cannot reach $DB_IP:5432 via raw TCP"
        echo "Note: Supabase may block raw TCP but allow SSL connections."
        echo "SSL connection may still work, continuing..."
    else
        echo "Port 5432 is reachable via IPv4"
    fi
else
    # If no IPv4, test with hostname (may fail if IPv6 disabled)
    if ! nc -vz -4 "$DB_HOST" 5432 >/dev/null 2>&1; then
        echo "WARNING: cannot reach $DB_HOST:5432"
        echo "This may be due to:"
        echo "  1. No IPv4 record for this hostname"
        echo "  2. IPv6 disabled but hostname resolves to IPv6"
        echo "  3. Firewall blocking connection"
        echo "Continuing anyway - SSL connection may still work..."
    else
        echo "Port 5432 is reachable"
    fi
fi

# Start Java application
exec java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+ExitOnOutOfMemoryError \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/tmp/heapdump.hprof \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.backgroundpreinitializer.ignore=true \
  -Dfile.encoding=UTF-8 \
  -Djava.net.preferIPv4Stack=true \
  -Djava.net.useSystemProxies=false \
  -Dnetworkaddress.cache.ttl=30 \
  -Dnetworkaddress.cache.negative.ttl=0 \
  -jar app.jar

