# Makefile targets

- `dev-up`: change it to `docker-compose -f docker-compose.yml -f docker-compose.ports.yml up $(PROJECT)_proxy $(PROJECT)_app $(PROJECT)_fe`. Consider a `COMPOSE_PORTS` variable holding the `-f` pair so it isn't repeated.
- Add `stack-up`: `docker-compose up -d $(PROJECT)_proxy $(PROJECT)_app $(PROJECT)_fe`, using the base file only, so no host ports are published. This target is for tests and investigation runners, which reach services by name on `majora_default`.
- Leave `tests`, `dev`, `setup` and the `client-*` targets on the base file. They now publish nothing, including the `majora_mysql` that `links:` pulls in.
- Add `stack-up` to `.PHONY`.

## Files to Change

- `Makefile` — `dev-up` uses the ports file; new `stack-up` target; `.PHONY` updated.
