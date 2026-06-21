#!/bin/bash

PLATFORM=${PLATFORM:-linux/amd64}

function image_version() {
  local image=$1
  cat version | grep "^${image}=" | sed -e "s/${image}=//g"
}

function build() {
  local image=$1
  local arch=$2
  local version
  version=$(image_version "$image")

  local platform tag_suffix
  if [ -n "$arch" ]; then
    platform="linux/$arch"
    tag_suffix="-$arch"
  else
    platform="$PLATFORM"
    tag_suffix=""
  fi

  local latest_tag="$DOCKER_ID_USER/$image:latest${tag_suffix}"
  local cached_tag="$DOCKER_ID_USER/$image:cached${tag_suffix}"
  local version_tag="$DOCKER_ID_USER/$image:${version}${tag_suffix}"

  docker tag "$latest_tag" "$cached_tag" 2>/dev/null || true
  docker rmi "$latest_tag" 2>/dev/null || true
  docker build --platform "$platform" \
    -f "dockerfiles/$image/Dockerfile" . \
    -t "$latest_tag"
  docker tag "$latest_tag" "$version_tag"
  if docker images | grep -q "$cached_tag"; then
    docker rmi "$cached_tag"
  fi
}

function push() {
  local image=$1
  local arch=$2
  local version tag_suffix
  version=$(image_version "$image")
  [ -n "$arch" ] && tag_suffix="-$arch" || tag_suffix=""

  echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin

  build "$image" "$arch"
  docker push "$DOCKER_ID_USER/$image:latest${tag_suffix}"
  docker push "$DOCKER_ID_USER/$image:${version}${tag_suffix}"
}

ACTION=$1
IMAGE_NAME=$2
ARCH=${3:-}

case $ACTION in
  "build") build "$IMAGE_NAME" "$ARCH" ;;
  "push")  push "$IMAGE_NAME" "$ARCH" ;;
  *)
    echo "Usage: $0 <action> <image_name> [arch]"
    echo "Actions: build, push"
    exit 1
    ;;
esac
