FROM darthjee/scripts:0.8.0 as scripts
FROM darthjee/node:0.2.1 as base

USER root
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
USER node

COPY --chown=node:node \
  ./frontend/package.json frontend/yarn.lock \
  /home/node/app/
COPY --chown=node:node --from=scripts \
  /home/scripts/sbin/deploy_frontend.sh /usr/local/sbin/

######################################

FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=node:node --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/node

COPY --chown=node:node --from=builder /home/node/yarn/new/ /usr/local/share/.cache/yarn/v6/

USER node

CMD ["npm", "run", "server"]
