# Skip cache when X-Skip-Cache header is present

## Context

On the proxy configuration (both production and dev), we need to skip the cache when the `X-Skip-Cache` header is present. This is done through the `Tent` proxy configuration, by setting `skip_cache_header` on the backend handler. Production's `prod_proxy_config/rules/backend.php` already sets `'skip_cache_header' => 'X-Skip-Cache'`, but the dev config (`docker_volumes/proxy_configuration/rules/backend.php`) is missing it, so requests with `X-Skip-Cache` don't bypass the cache in dev.

## What needs to be done

- **Infra**: Add `'skip_cache_header' => 'X-Skip-Cache'` to the `handler` config in `docker_volumes/proxy_configuration/rules/backend.php`, mirroring what `prod_proxy_config/rules/backend.php` already does. The `oak` project's equivalent dev rule already configures this same option and can be used as a reference.

## Acceptance criteria

- [ ] The dev backend proxy rule (`docker_volumes/proxy_configuration/rules/backend.php`) sets `skip_cache_header` to `X-Skip-Cache`, matching production.
- [ ] Requests with the `X-Skip-Cache` header bypass the proxy cache in the dev environment.
