# Docker Guide for PHF Backend

## Build Docker Image

```bash
docker build -t phf-back-end:latest .
```

## Push to Docker Hub

### Option 1: Sử dụng Script (Khuyến nghị)

**Windows PowerShell:**
```powershell
.\docker-push.ps1 -DockerHubUsername "your-username"
```

**Linux/Mac:**
```bash
chmod +x docker-push.sh
./docker-push.sh your-username
```

### Option 2: Chạy thủ công

```bash
# 1. Login to Docker Hub
docker login -u your-username

# 2. Build và tag image
docker build -t your-username/phf-back-end:latest .

# 3. Push image
docker push your-username/phf-back-end:latest

# 4. (Optional) Tag và push version cụ thể
docker tag your-username/phf-back-end:latest your-username/phf-back-end:v1.0.0
docker push your-username/phf-back-end:v1.0.0
```

### Pull từ Docker Hub

Sau khi push, người khác có thể pull image:

```bash
docker pull your-username/phf-back-end:latest

# Chạy container từ Docker Hub image
docker run -d \
  --name phf-backend \
  -p 8080:8080 \
  --dns 8.8.8.8 \
  --dns 8.8.4.4 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://db.yekpjpfhkjaydufdzxgo.supabase.co:5432/postgres?sslmode=prefer" \
  -e SPRING_DATASOURCE_USERNAME="pharama" \
  -e SPRING_DATASOURCE_PASSWORD="123" \
  your-username/phf-back-end:latest
```

## Run Docker Container

### Option 1: Sử dụng Script (Khuyến nghị - Tự động fix network issues)

**Windows PowerShell:**
```powershell
# Chạy với rebuild
.\docker-run.ps1 -Rebuild

# Hoặc chạy không rebuild (nếu đã build rồi)
.\docker-run.ps1
```

Script sẽ tự động:
- Test network connectivity
- Resolve DNS
- Chạy container với DNS fix (`--dns 8.8.8.8`)
- Test internet, DNS, và database port từ container
- Hiển thị logs

### Option 2: Chạy thủ công với DNS fix và clear proxy (Khuyến nghị)

```bash
docker stop phf-backend 2>/dev/null || true
docker rm phf-backend 2>/dev/null || true

docker run -d \
  --name phf-backend \
  -p 8080:8080 \
  --dns 8.8.8.8 \
  --dns 1.1.1.1 \
  --sysctl net.ipv6.conf.all.disable_ipv6=1 \
  --sysctl net.ipv6.conf.default.disable_ipv6=1 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://db.yekpjpfhkjaydufdzxgo.supabase.co:5432/postgres?sslmode=require" \
  -e SPRING_DATASOURCE_USERNAME="pharama" \
  -e SPRING_DATASOURCE_PASSWORD="123" \
  -e HTTP_PROXY="" \
  -e HTTPS_PROXY="" \
  -e ALL_PROXY="" \
  -e NO_PROXY=".supabase.co,localhost,127.0.0.1" \
  -e JAVA_TOOL_OPTIONS="" \
  phf-back-end:latest
```

**Lưu ý:** 
- `--dns 8.8.8.8 --dns 1.1.1.1` ép DNS public để fix DNS resolution issues
- `--sysctl net.ipv6.conf.all.disable_ipv6=1` tắt IPv6 để buộc dùng IPv4
- Clear proxy environment variables để tránh JVM pick up proxy settings

### Option 3: Sử dụng Default Values (từ application.yml)

```bash
docker run -d \
  --name phf-backend \
  -p 8080:8080 \
  --dns 8.8.8.8 \
  --dns 8.8.4.4 \
  phf-back-end:latest
```

### Option 4: Using Docker Compose

Sử dụng file `docker-compose.yml` có sẵn:

```yaml
services:
  phf-back-end:
    image: phf-back-end:latest
    ports: ["8080:8080"]
    dns: [8.8.8.8, 1.1.1.1]
    environment:
      SPRING_DATASOURCE_URL: "jdbc:postgresql://db.yekpjpfhkjaydufdzxgo.supabase.co:5432/postgres?sslmode=require"
      SPRING_DATASOURCE_USERNAME: "pharama"
      SPRING_DATASOURCE_PASSWORD: "123"
      HTTP_PROXY: ""
      HTTPS_PROXY: ""
      ALL_PROXY: ""
      NO_PROXY: ".supabase.co,localhost,127.0.0.1"
      JAVA_TOOL_OPTIONS: ""
```

Then run:
```bash
docker-compose up -d
```

**Lưu ý:**
- DNS được ép về public DNS (8.8.8.8, 1.1.1.1)
- IPv6 được disable qua sysctls để buộc dùng IPv4
- Proxy environment variables được clear để tránh JVM pick up

## Troubleshooting

### Check Container Logs

```bash
docker logs phf-backend
```

### Check Container Status

```bash
docker ps -a
```

### Check Health Status

```bash
docker inspect --format='{{.State.Health.Status}}' phf-backend
```

### Common Issues

1. **Database Connection Failed**
   - Verify database URL is accessible from Docker container
   - Check firewall rules if using external database
   - Ensure database credentials are correct
   - Check network connectivity: `docker exec phf-backend ping db.yekpjpfhkjaydufdzxgo.supabase.co`

2. **Container Exits Immediately**
   - Check logs: `docker logs phf-backend`
   - Verify environment variables are set correctly
   - Check database connection settings

3. **Health Check Failing**
   - Application may need more time to start (start-period is 120s)
   - Check if application is actually running: `docker exec phf-backend ps aux`

## Network Configuration

### Tại sao Local chạy tốt nhưng Docker lại lỗi?

**Nguyên nhân phổ biến:**

1. **Docker Desktop Network Isolation** (Windows/Mac)
   - Docker container chạy trong VM riêng, có network stack riêng
   - DNS resolution có thể khác với host machine
   - Firewall rules có thể block Docker network

2. **DNS Resolution**
   - Container có thể không resolve được hostname `db.yekpjpfhkjaydufdzxgo.supabase.co`
   - DNS server trong container khác với host

3. **Firewall/Antivirus**
   - Windows Firewall hoặc Antivirus có thể block Docker network
   - Corporate firewall có thể block outbound connections từ Docker

4. **Supabase IP Restrictions**
   - Supabase có thể whitelist IP của bạn (local) nhưng block Docker container IP

### Giải pháp:

#### Giải pháp 1: Kiểm tra DNS trong Container

```bash
# Test DNS resolution từ container
docker exec phf-backend nslookup db.yekpjpfhkjaydufdzxgo.supabase.co

# Nếu không resolve được, thử dùng IP trực tiếp
# Tìm IP của database host từ local machine:
nslookup db.yekpjpfhkjaydufdzxgo.supabase.co

# Sau đó dùng IP trong connection string:
docker run -d \
  --name phf-backend \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://<IP_ADDRESS>:5432/postgres?sslmode=require" \
  -e SPRING_DATASOURCE_USERNAME="pharama" \
  -e SPRING_DATASOURCE_PASSWORD="123" \
  phf-back-end:latest
```

#### Giải pháp 2: Sử dụng Host DNS (Windows/Mac)

```bash
# Thêm DNS server của host vào container
docker run -d \
  --name phf-backend \
  -p 8080:8080 \
  --dns 8.8.8.8 \
  --dns 8.8.4.4 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://db.yekpjpfhkjaydufdzxgo.supabase.co:5432/postgres?sslmode=require" \
  -e SPRING_DATASOURCE_USERNAME="pharama" \
  -e SPRING_DATASOURCE_PASSWORD="123" \
  phf-back-end:latest
```

#### Giải pháp 3: Kiểm tra Docker Network

```bash
# Kiểm tra container có internet không
docker exec phf-backend ping -c 3 8.8.8.8

# Kiểm tra có thể connect đến port 5432 không
docker exec phf-backend sh -c "timeout 5 nc -zv db.yekpjpfhkjaydufdzxgo.supabase.co 5432"
```

#### Giải pháp 4: Sử dụng Host Network (chỉ Linux)

```bash
# Chạy với host network (chỉ hoạt động trên Linux)
docker run -d \
  --name phf-backend \
  --network host \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://db.yekpjpfhkjaydufdzxgo.supabase.co:5432/postgres?sslmode=require" \
  -e SPRING_DATASOURCE_USERNAME="pharama" \
  -e SPRING_DATASOURCE_PASSWORD="123" \
  phf-back-end:latest
```

#### Giải pháp 5: Kiểm tra Windows Firewall

1. Mở Windows Defender Firewall
2. Advanced Settings → Inbound Rules
3. Tìm Docker rules và đảm bảo chúng được enable
4. Hoặc tạm thời tắt firewall để test

#### Giải pháp 6: Sử dụng Docker Desktop Settings

1. Mở Docker Desktop
2. Settings → Resources → Network
3. Đảm bảo "Use kernel networking" được bật (nếu có)
4. Restart Docker Desktop

### Debug Commands

```bash
# 1. Kiểm tra network connectivity
docker exec phf-backend ping -c 3 8.8.8.8

# 2. Kiểm tra DNS resolution
docker exec phf-backend nslookup db.yekpjpfhkjaydufdzxgo.supabase.co

# 3. Kiểm tra port connectivity
docker exec phf-backend sh -c "timeout 5 nc -zv db.yekpjpfhkjaydufdzxgo.supabase.co 5432"

# 4. Xem network configuration của container
docker inspect phf-backend | grep -A 20 "NetworkSettings"

# 5. Test từ host machine (so sánh)
ping db.yekpjpfhkjaydufdzxgo.supabase.co
telnet db.yekpjpfhkjaydufdzxgo.supabase.co 5432
```

### Nếu database trên host machine

```bash
# Windows/Mac: Sử dụng host.docker.internal
-e SPRING_DATASOURCE_URL="jdbc:postgresql://host.docker.internal:5432/postgres"

# Linux: Thêm host mapping
docker run --add-host=host.docker.internal:host-gateway ...
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | From application.yml |
| `SPRING_DATASOURCE_USERNAME` | Database username | From application.yml |
| `SPRING_DATASOURCE_PASSWORD` | Database password | From application.yml |

