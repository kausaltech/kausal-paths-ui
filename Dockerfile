FROM node:14.18-alpine

RUN mkdir -p /app
WORKDIR /app

COPY package.json yarn.lock /app/
COPY patches /app/patches/
RUN yarn install

COPY . /app

RUN yarn build

EXPOSE 3000
CMD bin/run.sh
