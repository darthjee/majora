FROM darthjee/scripts:0.8.0 as scripts
FROM darthjee/production_majora-base:latest as base

######################################

FROM base as builder

COPY --chown=app:app ./backend/ /home/app/app/

ENV HOME_DIR /home/app

USER app
COPY --chown=app:app --from=scripts /home/scripts/builder/poetry_builder.sh /usr/local/sbin/poetry_builder.sh
RUN /bin/bash poetry_builder.sh --only main
RUN rm -rf */tests

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/app

COPY --chown=app:app --from=builder /home/app/poetry/new/ /home/app/.cache/pypoetry/artifacts/
COPY --chown=app:app --from=builder /home/app/app/ /home/app/app/

USER app

RUN poetry install --no-root --only main
