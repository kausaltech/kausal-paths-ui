#syntax=docker/dockerfile:1

FROM node:18-alpine as base

RUN mkdir -p /app
WORKDIR /app

RUN apk --no-cache add git
RUN corepack enable npm

ARG NPM_REGISTRY_SERVER
ARG NPM_TOKEN

ENV NPM_CONFIG_CACHE /npm-cache
COPY package*.json docker/ ./
# COPY patches ./patches/

RUN \
  if [ ! -z "${NPM_REGISTRY_SERVER}" ] ; then \
    echo "@kausal:registry=${NPM_REGISTRY_SERVER}" >> $HOME/.npmrc ; \
    echo "$(echo ${NPM_REGISTRY_SERVER} | sed -e 's/https://')/"':_authToken="${NPM_TOKEN}"' >> $HOME/.npmrc ; \
  fi

RUN --mount=type=cache,target=/npm-cache npm ci

COPY . .

FROM base as bundle

# For Sentry source map upload
ARG SENTRY_PROJECT
ARG SENTRY_URL
ARG SENTRY_ORG
ARG SENTRY_AUTH_TOKEN
ARG GIT_REPO
ARG GIT_REV

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
  npm run build

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
  docker/sentry-set-release-commits.sh

COPY ./docker/entrypoint.sh /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
