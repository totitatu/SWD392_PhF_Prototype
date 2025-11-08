#!/bin/sh
# Shell script to build and push Docker image to Docker Hub

if [ $# -eq 0 ]; then
    echo "Usage: ./docker-push.sh <dockerhub-username> [tag]"
    echo "Example: ./docker-push.sh myusername latest"
    exit 1
fi

DOCKERHUB_USERNAME=$1
IMAGE_TAG=${2:-latest}
IMAGE_NAME="phf-back-end"
FULL_IMAGE_NAME="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "=== Building and Pushing to Docker Hub ==="
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo "Image Name: $FULL_IMAGE_NAME"

# Check if Docker is running
echo ""
echo "1. Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "   ✗ Docker is not running!"
    echo "   → Please start Docker"
    exit 1
fi
echo "   ✓ Docker is running"

# Login to Docker Hub
echo ""
echo "2. Logging in to Docker Hub..."
docker login -u "$DOCKERHUB_USERNAME"
if [ $? -ne 0 ]; then
    echo "   ✗ Docker Hub login failed!"
    exit 1
fi
echo "   ✓ Logged in successfully"

# Build image
echo ""
echo "3. Building Docker image..."
docker build -t "$FULL_IMAGE_NAME" -t "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest" .
if [ $? -ne 0 ]; then
    echo "   ✗ Build failed!"
    exit 1
fi
echo "   ✓ Build successful"

# Tag image (if not already tagged)
if [ "$IMAGE_TAG" != "latest" ]; then
    echo ""
    echo "4. Tagging image..."
    docker tag "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest" "$FULL_IMAGE_NAME"
    echo "   ✓ Tagged as $FULL_IMAGE_NAME"
fi

# Push image
echo ""
echo "5. Pushing image to Docker Hub..."
echo "   Pushing ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest..."
docker push "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"

if [ "$IMAGE_TAG" != "latest" ]; then
    echo "   Pushing $FULL_IMAGE_NAME..."
    docker push "$FULL_IMAGE_NAME"
fi

if [ $? -eq 0 ]; then
    echo "   ✓ Push successful!"
else
    echo "   ✗ Push failed!"
    exit 1
fi

echo ""
echo "=== Done ==="
echo "Image available at:"
echo "  https://hub.docker.com/r/${DOCKERHUB_USERNAME}/${IMAGE_NAME}"
echo ""
echo "Pull command:"
echo "  docker pull $FULL_IMAGE_NAME"



