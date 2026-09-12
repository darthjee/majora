# Add the derived Dockerfile

Create `dockerfiles/navi_hey_loot_enqueue/Dockerfile`, modeled on the "Baking the
extension into a derived image" pattern in
`docs/agents/external/navi/extending-navi.md` (this repo has no
`dockerfiles/navi_hey_extension_example/` — that path in the doc is illustrative
only):

```dockerfile
ARG NAVI_TAG=1.11.1
FROM darthjee/navi-hey:${NAVI_TAG}

COPY crawler/navi-extension/dist/ /navi/extensions/
COPY crawler/navi-extension/config/menu.yml /home/node/app/config/menu.yml
COPY crawler/navi_config.web.yaml crawler/navi_config.yaml /home/node/app/config/

ENV NAVI_EXTENSIONS_ENABLED=true

CMD ["navi-hey", "--config", "/home/node/app/config/navi_config.web.yaml"]
```

- `ARG NAVI_TAG` default must match `crawler/navi-extension/.env`'s `NAVI_TAG`
  (currently `1.11.1`) — see the plan's Notes on single-sourcing this value.
- Both `crawler/navi_config.web.yaml` (`include: [navi_config.yaml]`) and
  `crawler/navi_config.yaml` are copied in, since the web config includes the
  headless one at Navi's own config-load time, inside the container.
- The menu file goes to `/home/node/app/config/menu.yml` (the `NAVI_MENU`
  default resolved against the image `WORKDIR`), **not** `/navi/menu.yml`.
- Build context is the repo root (needed for the `crawler/...` COPY paths) —
  this is set on the `build:` block in Step 2, not here.
- Add a comment at the top of the Dockerfile documenting that
  `crawler/navi-extension/dist/` must be built first
  (`cd crawler/navi-extension && yarn build`) — it is gitignored and this image
  does not build it.

## Files to Change

- `dockerfiles/navi_hey_loot_enqueue/Dockerfile` (new)
