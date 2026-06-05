FROM darthjee/node:0.2.1

COPY frontend/package.json /home/node/app/
COPY frontend/yarn.lock /home/node/app/

WORKDIR /home/node/app

RUN yarn_builder.sh
