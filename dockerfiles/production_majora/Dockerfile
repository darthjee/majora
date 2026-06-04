FROM darthjee/production_majora-base:latest

WORKDIR /home/app/app

COPY source/ /home/app/app/

RUN rm -rf */tests

RUN poetry install --no-root --only main

CMD ["bin/server.sh"]
