# PowerShell script to build and push Docker image to Docker Hub

param(
    [Parameter(Mandatory=$true)]
    [string]$DockerHubUsername,
    
    [string]$ImageTag = "latest",
    [switch]$SkipBuild = $false
)

$ImageName = "phf-back-end"
$FullImageName = "${DockerHubUsername}/${ImageName}:${ImageTag}"

Write-Host "=== Building and Pushing to Docker Hub ===" -ForegroundColor Cyan
Write-Host "Docker Hub Username: $DockerHubUsername" -ForegroundColor Yellow
Write-Host "Image Name: $FullImageName" -ForegroundColor Yellow

# Check if Docker is running
Write-Host "`n1. Checking Docker..." -ForegroundColor Cyan
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Docker is not running!" -ForegroundColor Red
    Write-Host "   → Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✓ Docker is running" -ForegroundColor Green

# Login to Docker Hub
Write-Host "`n2. Logging in to Docker Hub..." -ForegroundColor Cyan
docker login -u $DockerHubUsername
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Docker Hub login failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Logged in successfully" -ForegroundColor Green

# Build image
if (-not $SkipBuild) {
    Write-Host "`n3. Building Docker image..." -ForegroundColor Cyan
    docker build -t $FullImageName -t "${DockerHubUsername}/${ImageName}:latest" .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "`n3. Skipping build (using existing image)..." -ForegroundColor Yellow
}

# Tag image (if not already tagged)
Write-Host "`n4. Tagging image..." -ForegroundColor Cyan
if ($ImageTag -ne "latest") {
    docker tag "${DockerHubUsername}/${ImageName}:latest" $FullImageName
    Write-Host "   ✓ Tagged as $FullImageName" -ForegroundColor Green
}

# Push image
Write-Host "`n5. Pushing image to Docker Hub..." -ForegroundColor Cyan
Write-Host "   Pushing ${DockerHubUsername}/${ImageName}:latest..." -ForegroundColor Yellow
docker push "${DockerHubUsername}/${ImageName}:latest"

if ($ImageTag -ne "latest") {
    Write-Host "   Pushing $FullImageName..." -ForegroundColor Yellow
    docker push $FullImageName
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Push successful!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Image available at:" -ForegroundColor Green
Write-Host "  https://hub.docker.com/r/${DockerHubUsername}/${ImageName}" -ForegroundColor Cyan
Write-Host "`nPull command:" -ForegroundColor Yellow
Write-Host "  docker pull $FullImageName" -ForegroundColor Gray



