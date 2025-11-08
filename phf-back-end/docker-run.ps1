# PowerShell script to run Docker container with network fixes
# Giải quyết vấn đề "Network unreachable" khi local chạy tốt nhưng Docker lỗi

param(
    [switch]$Rebuild = $false
)

Write-Host "=== PHF Backend Docker Run with Network Fixes ===" -ForegroundColor Cyan

# Rebuild if requested
if ($Rebuild) {
    Write-Host "`n0. Rebuilding Docker image..." -ForegroundColor Yellow
    docker build -t phf-back-end:latest .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Build successful" -ForegroundColor Green
}

# Stop and remove existing container
Write-Host "`n1. Stopping existing container..." -ForegroundColor Yellow
docker stop phf-backend 2>$null
docker rm phf-backend 2>$null

# Test network from host
Write-Host "`n2. Testing network from host machine..." -ForegroundColor Cyan
try {
    $hostTest = Test-NetConnection -ComputerName db.yekpjpfhkjaydufdzxgo.supabase.co -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($hostTest) {
        Write-Host "   ✓ Host can reach database" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Host cannot reach database port (may be normal if firewall blocks)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠ Cannot test connection (may be normal)" -ForegroundColor Yellow
}

# Get IP address of database host
Write-Host "`n3. Resolving database hostname..." -ForegroundColor Cyan
try {
    $dnsResult = Resolve-DnsName -Name db.yekpjpfhkjaydufdzxgo.supabase.co -Type A -ErrorAction Stop
    $dbIp = $dnsResult[0].IPAddress
    Write-Host "   Database IP: $dbIp" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Cannot resolve hostname" -ForegroundColor Red
    $dbIp = $null
}

# Run container with DNS fix
Write-Host "`n4. Starting container with DNS fix (--dns 8.8.8.8)..." -ForegroundColor Cyan
docker run -d `
  --name phf-backend `
  -p 8080:8080 `
  --dns 8.8.8.8 `
  --dns 8.8.4.4 `
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://db.yekpjpfhkjaydufdzxgo.supabase.co:5432/postgres?sslmode=prefer&ApplicationName=phf-back-end&connectTimeout=30&socketTimeout=30" `
  -e SPRING_DATASOURCE_USERNAME="pharama" `
  -e SPRING_DATASOURCE_PASSWORD="123" `
  phf-back-end:latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Container started" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to start container" -ForegroundColor Red
    exit 1
}

# Wait a bit
Write-Host "`n5. Waiting 5 seconds for container to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test network from container
Write-Host "`n6. Testing network from container..." -ForegroundColor Cyan
Write-Host "   Testing internet connectivity..."
$pingResult = docker exec phf-backend ping -c 2 8.8.8.8 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Container has internet access" -ForegroundColor Green
} else {
    Write-Host "   ✗ Container has NO internet access!" -ForegroundColor Red
    Write-Host "   → Check Docker Desktop network settings" -ForegroundColor Yellow
    Write-Host "   → Restart Docker Desktop" -ForegroundColor Yellow
}

Write-Host "`n   Testing DNS resolution..."
$dnsResult = docker exec phf-backend nslookup db.yekpjpfhkjaydufdzxgo.supabase.co 2>&1
if ($dnsResult -match "Address" -or $dnsResult -match "Name:") {
    Write-Host "   ✓ DNS resolution works" -ForegroundColor Green
} else {
    Write-Host "   ✗ DNS resolution failed!" -ForegroundColor Red
    Write-Host "   → Try using IP address instead of hostname" -ForegroundColor Yellow
    if ($dbIp) {
        Write-Host "`n   Alternative command with IP address:" -ForegroundColor Yellow
        Write-Host "   docker stop phf-backend; docker rm phf-backend" -ForegroundColor Gray
        Write-Host "   docker run -d --name phf-backend -p 8080:8080 \`" -ForegroundColor Gray
        Write-Host "     -e SPRING_DATASOURCE_URL=`"jdbc:postgresql://$dbIp:5432/postgres?sslmode=prefer`" \`" -ForegroundColor Gray
        Write-Host "     -e SPRING_DATASOURCE_USERNAME=`"pharama`" \`" -ForegroundColor Gray
        Write-Host "     -e SPRING_DATASOURCE_PASSWORD=`"123`" \`" -ForegroundColor Gray
        Write-Host "     phf-back-end:latest" -ForegroundColor Gray
    }
}

Write-Host "`n   Testing database port connectivity..."
$portTest = docker exec phf-backend nc -zv -w 5 db.yekpjpfhkjaydufdzxgo.supabase.co 5432 2>&1
if ($portTest -match "succeeded" -or $portTest -match "open") {
    Write-Host "   ✓ Can reach database port 5432" -ForegroundColor Green
} else {
    Write-Host "   ✗ Cannot reach database port 5432" -ForegroundColor Red
    Write-Host "   → Check Supabase firewall settings" -ForegroundColor Yellow
    Write-Host "   → Check your network/firewall" -ForegroundColor Yellow
}

# Show logs
Write-Host "`n7. Container logs (last 30 lines):" -ForegroundColor Cyan
docker logs phf-backend --tail 30

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  docker logs -f phf-backend          # Follow logs" -ForegroundColor Gray
Write-Host "  docker exec phf-backend ping -c 3 8.8.8.8  # Test internet" -ForegroundColor Gray
Write-Host "  docker exec phf-backend nslookup db.yekpjpfhkjaydufdzxgo.supabase.co  # Test DNS" -ForegroundColor Gray
Write-Host "  docker exec phf-backend nc -zv db.yekpjpfhkjaydufdzxgo.supabase.co 5432  # Test port" -ForegroundColor Gray



