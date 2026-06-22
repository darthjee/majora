#!/bin/bash

PLATFORM=${PLATFORM:-linux/amd64}

function image_version() {
  local image=$1
  cat version | grep "^${image}=" | sed -e "s/${image}=//g"
}

function skip_if_not_tag() {
  if [ -z "$CIRCLE_TAG" ]; then
    echo "Not a tag build, skipping."
    exit 0
  fi
}

function skip_if_unchanged() {
  local image=$1

  local prev_tag
  prev_tag=$(git tag --sort=-creatordate | awk 'NR==2{print; exit}')

  if [ -z "$prev_tag" ]; then
    echo "No previous tag found, proceeding with release of ${image}."
    return 0
  fi

  if git diff --quiet "$prev_tag"..HEAD -- "dockerfiles/${image}/"; then
    echo "No changes in dockerfiles/${image}/ since ${prev_tag}, skipping."
    exit 0
  fi
}

function setup_qemu() {
  local image=$1

  skip_if_not_tag

  skip_if_unchanged "$image"

  docker run --privileged --rm tonistiigi/binfmt --install all
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

  skip_if_not_tag

  skip_if_unchanged "$image"

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
  "qemu")  setup_qemu "$IMAGE_NAME" ;;
  *)
    echo "Usage: $0 <action> <image_name> [arch]"
    echo "Actions: build, push, qemu"
    exit 1
    ;;
esac
