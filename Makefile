.PHONY: build-base push-base build push build-fe-base push-fe-base build-fe push-fe dev dev-up setup tests

PROJECT?=majora
IMAGE?=$(PROJECT)
BASE_VERSION?=0.0.1
BASE_IMAGE?=$(DOCKER_ID_USER)/$(PROJECT)-base
FE_BASE_IMAGE?=$(DOCKER_ID_USER)/vite_$(PROJECT)-base
FE_IMAGE?=$(DOCKER_ID_USER)/vite_$(PROJECT)
PUSH_IMAGE=$(DOCKER_ID_USER)/$(PROJECT)
DOCKER_FILE_BASE=dockerfiles/$(PROJECT)-base/Dockerfile
DOCKER_FILE=dockerfiles/$(PROJECT)/Dockerfile
DOCKER_FILE_FE_BASE=dockerfiles/vite_$(PROJECT)-base/Dockerfile
DOCKER_FILE_FE=dockerfiles/vite_$(PROJECT)/Dockerfile

# ── Backend ──────────────────────────────────────────────────────────────────

build-base:
	docker tag $(BASE_IMAGE):latest $(BASE_IMAGE):cached; \
	docker rmi $(BASE_IMAGE):latest; \
	docker build -f $(DOCKER_FILE_BASE) . -t $(BASE_IMAGE):latest -t $(BASE_IMAGE):$(BASE_VERSION); \
	if (docker images | grep $(BASE_IMAGE) | grep cached); then \
	  docker rmi $(BASE_IMAGE):cached; \
	fi

push-base:
	make build-base
	docker push $(BASE_IMAGE)
	docker push $(BASE_IMAGE):$(BASE_VERSION)

build:
	docker build -f $(DOCKER_FILE) . -t $(IMAGE) -t $(PUSH_IMAGE) -t $(PUSH_IMAGE):$(BASE_VERSION)

push:
	make build
	docker push $(PUSH_IMAGE)
	docker push $(PUSH_IMAGE):$(BASE_VERSION)

# ── Frontend ─────────────────────────────────────────────────────────────────

build-fe-base:
	docker tag $(FE_BASE_IMAGE):latest $(FE_BASE_IMAGE):cached; \
	docker rmi $(FE_BASE_IMAGE):latest; \
	docker build -f $(DOCKER_FILE_FE_BASE) . -t $(FE_BASE_IMAGE):latest -t $(FE_BASE_IMAGE):$(BASE_VERSION); \
	if (docker images | grep $(FE_BASE_IMAGE) | grep cached); then \
	  docker rmi $(FE_BASE_IMAGE):cached; \
	fi

push-fe-base:
	make build-fe-base
	docker push $(FE_BASE_IMAGE)
	docker push $(FE_BASE_IMAGE):$(BASE_VERSION)

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
