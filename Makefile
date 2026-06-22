.PHONY: build-base push-base build push build-fe-base push-fe-base build-fe push-fe build-circleci-base push-circleci-base build-production-base push-production-base dev dev-up setup tests

PROJECT?=majora
IMAGE?=$(PROJECT)
BASE_VERSION?=0.1.0
FE_IMAGE?=$(DOCKER_ID_USER)/vite_$(PROJECT)
PUSH_IMAGE=$(DOCKER_ID_USER)/$(PROJECT)
DOCKER_FILE=dockerfiles/$(PROJECT)/Dockerfile
DOCKER_FILE_FE=dockerfiles/vite_$(PROJECT)/Dockerfile

# ── Base images ────────────────────────────────────────────────────────────────

build-base:
	bin/image.sh build majora-base

push-base:
	bin/image.sh push majora-base

build-circleci-base:
	bin/image.sh build circleci_majora-base

push-circleci-base:
	bin/image.sh push circleci_majora-base

build-production-base:
	bin/image.sh build production_majora-base

push-production-base:
	bin/image.sh push production_majora-base

build-fe-base:
	bin/image.sh build vite_majora-base

push-fe-base:
	bin/image.sh push vite_majora-base

# ── Backend ──────────────────────────────────────────────────────────────────

build:
	docker build -f $(DOCKER_FILE) . -t $(IMAGE) -t $(PUSH_IMAGE) -t $(PUSH_IMAGE):$(BASE_VERSION)

push:
	make build
	docker push $(PUSH_IMAGE)
	docker push $(PUSH_IMAGE):$(BASE_VERSION)

# ── Frontend ─────────────────────────────────────────────────────────────────

build-fe:
	docker build -f $(DOCKER_FILE_FE) . -t $(FE_IMAGE) -t $(FE_IMAGE):$(BASE_VERSION)

push-fe:
	make build-fe
	docker push $(FE_IMAGE)
	docker push $(FE_IMAGE):$(BASE_VERSION)

# ── Development ───────────────────────────────────────────────────────────────

setup: .env
	docker-compose run --rm $(PROJECT)_app poetry run python manage.py migrate

dev:
	docker-compose run $(PROJECT)_app /bin/bash

dev-up:
	docker-compose up $(PROJECT)_proxy $(PROJECT)_app $(PROJECT)_fe

tests:
	docker-compose run $(PROJECT)_tests /bin/bash

# ── Environment files ─────────────────────────────────────────────────────────

.env:
	cp .env.dev.sample .env

.env.production:
	touch .env.production
