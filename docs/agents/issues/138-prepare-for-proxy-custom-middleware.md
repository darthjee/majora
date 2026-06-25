# Prepare for Proxy Custom Middleware

## Context

The proxy configuration is currently split across two poorly-named top-level directories: `docker_volumes/proxy_configuration` for dev routing rules and `prod_proxy_config` for production routing rules. This fragmented layout makes it hard to extend the proxy with custom middleware. There is no established directory structure or test harness for writing custom Tent middleware PHP classes.

## What needs to be done

**Infra:**
- Move `docker_volumes/proxy_configuration/` to `proxy/dev_configuration/` and remove the now-empty `docker_volumes/proxy_configuration/` subfolder
- Move `prod_proxy_config/` to `proxy/prod_configuration/`
- Update the volume mount in `docker-compose.yml` from `./docker_volumes/proxy_configuration` to `./proxy/dev_configuration`
- Add a test service in `docker-compose.yml` using the `darthjee/tent` image that mounts `proxy/custom/` and runs tests in `proxy/custom/tests/`
- Update the `upload_proxy_files` job in `.circleci/config.yml` to upload from `proxy/prod_configuration/` (remote target path remains `configuration/`)
- Create `proxy/custom/extend/` and `proxy/custom/tests/` directories
- Implement a sample middleware PHP class in `proxy/custom/extend/` (using the `Tent\` namespace) that adds the response header `x-test-header: added`, with a corresponding test in `proxy/custom/tests/`

## Acceptance criteria

- [ ] `proxy/dev_configuration/` contains the former `docker_volumes/proxy_configuration/` content
- [ ] `proxy/prod_configuration/` contains the former `prod_proxy_config/` content
- [ ] The old `docker_volumes/proxy_configuration/` subfolder no longer exists
- [ ] `docker-compose.yml` mounts `./proxy/dev_configuration` for the proxy service
- [ ] `docker-compose.yml` has a test service for running custom middleware tests using `darthjee/tent`
- [ ] `.circleci/config.yml` `upload_proxy_files` job uploads from `proxy/prod_configuration/`
- [ ] A sample middleware PHP class exists in `proxy/custom/extend/` (under `Tent\` namespace) that adds `x-test-header: added`
- [ ] A passing test for the sample middleware exists in `proxy/custom/tests/`
