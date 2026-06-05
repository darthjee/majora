FROM darthjee/django:0.0.2

COPY source/pyproject.toml /home/app/app/
COPY source/poetry.lock /home/app/app/

WORKDIR /home/app/app

RUN poetry_builder.sh --only main
