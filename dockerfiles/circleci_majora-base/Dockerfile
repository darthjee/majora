FROM darthjee/scripts:0.8.0 as scripts
FROM darthjee/circleci_django:0.0.2 as base

######################################

FROM base as builder

COPY --chown=circleci:circleci \
  ./source/pyproject.toml ./source/poetry.lock* \
  /home/circleci/project

ENV HOME_DIR /home/circleci

USER circleci
COPY --chown=circleci:circleci --from=scripts /home/scripts/builder/poetry_builder.sh /usr/local/sbin/poetry_builder.sh
RUN /bin/bash poetry_builder.sh

#######################
# FINAL IMAGE
FROM base

COPY --chown=circleci:circleci --from=builder /home/circleci/poetry/new/ /home/circleci/.cache/pypoetry/artifacts/
USER circleci
