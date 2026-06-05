FROM darthjee/scripts:0.8.0 as scripts
FROM darthjee/majora-base:latest as base

COPY --chown=app:app \
  ./source/pyproject.toml ./source/poetry.lock* \
  /home/app/app/

######################################

FROM base as builder

ENV HOME_DIR /home/app

USER app
COPY --chown=app:app --from=scripts /home/scripts/builder/poetry_builder.sh /usr/local/sbin/poetry_builder.sh
RUN /bin/bash poetry_builder.sh

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/app

COPY --chown=app:app --from=builder /home/app/poetry/new/ /home/app/.cache/pypoetry/artifacts/

USER app

RUN poetry install --no-root
