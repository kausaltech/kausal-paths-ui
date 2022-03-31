FROM node:14.18-alpine as base

RUN mkdir -p /app
WORKDIR /app

RUN apk --no-cache add git

ENV YARN_CACHE_FOLDER /yarn-cache
COPY package.json yarn.lock /app/
COPY patches /app/patches/
RUN --mount=type=cache,target=/yarn-cache yarn install

COPY . /app

FROM base as bundle

# For Sentry source map upload
ARG SENTRY_PROJECT
ARG SENTRY_URL
ARG SENTRY_ORG
ARG SENTRY_AUTH_TOKEN
ARG GIT_REPO
ARG GIT_REV

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    yarn build

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    docker/sentry-set-release-commits.sh

EXPOSE 3000
CMD bin/run.sh
