# Derived image baking the crawler's navi-extension (Loot Enqueue UI) into the
# stock darthjee/navi-hey image. Build crawler/navi-extension/dist/ first
# (cd crawler/navi-extension && yarn build) — it is gitignored and this image
# does not build it.
#
# Build context must be the repo root (needed for the crawler/... COPY paths).

ARG NAVI_TAG=1.11.1
FROM darthjee/navi-hey:${NAVI_TAG}

COPY crawler/navi-extension/dist/ /navi/extensions/
COPY crawler/navi-extension/config/menu.yml /home/node/app/config/menu.yml
COPY crawler/navi_config.web.yaml crawler/navi_config.yaml /home/node/app/config/

ENV NAVI_EXTENSIONS_ENABLED=true

CMD ["navi-hey", "--config", "/home/node/app/config/navi_config.web.yaml"]
