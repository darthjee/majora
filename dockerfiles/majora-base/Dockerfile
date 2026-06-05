FROM darthjee/scripts:0.8.0 as scripts
FROM darthjee/django:0.0.2 as base

CMD ["bin/server.sh"]

######################################

FROM base as builder

COPY --chown=app:app \
  ./source/pyproject.toml ./source/poetry.lock* \
  /home/app/app/

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
