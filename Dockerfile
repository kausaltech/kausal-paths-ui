#syntax=docker/dockerfile:1.17-labs
ARG base_image=node:20-alpine
#
# Install dependencies
#
FROM ${base_image} AS deps

WORKDIR /app

ARG NPM_REGISTRY_SERVER

ENV NPM_CONFIG_CACHE=/npm-cache
COPY package*.json ./

RUN --mount=type=secret,id=NPM_USER --mount=type=secret,id=NPM_PASSWORD --mount=type=cache,target=/npm-cache <<EOF
  set -e
  if [ ! -z "${NPM_REGISTRY_SERVER}" ] ; then
    echo "Using custom registry at: ${NPM_REGISTRY_SERVER}"
    ls -l /run/secrets
    if [ ! -f /run/secrets/NPM_USER  -o ! -f /run/secrets/NPM_PASSWORD ] ; then
      echo "Custom registry credentials not passed as secrets"
      exit 1
    fi
    export NPM_USER="$(cat /run/secrets/NPM_USER)"
    export NPM_PASS="$(cat /run/secrets/NPM_PASSWORD)"
    if [ -z "$NPM_USER" -o -z "$NPM_PASS" ] ; then
      echo "Custom registry credentials not set"
      exit 1
    fi
    echo "Logging in to custom registry"
    npx -y npm-cli-login@1.0.0 -r "${NPM_REGISTRY_SERVER}" -e "${NPM_USER}@kausal.tech"
    echo "@kausal-private:registry=${NPM_REGISTRY_SERVER}" >> $HOME/.npmrc
    echo "registry=https://registry.npmjs.org/" >> $HOME/.npmrc
  fi
EOF

RUN npm ci --include optional

RUN <<EOF
  set -e
  if [ ! -d node_modules/@kausal-private/themes-private ] ; then
    echo Private themes not found.
    exit 1
  fi
EOF

#
# NextJS base
#
FROM ${base_image} AS nextjs_base

ENV NODE_ENV=production
ARG NEXTJS_STANDALONE_BUILD=1
ENV NEXTJS_STANDALONE_BUILD=${NEXTJS_STANDALONE_BUILD}
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXTJS_ASSET_PREFIX_PLACEHOLDER=__KAUSAL_ASSET_PREFIX_PLACEHOLDER__
ENV NEXTJS_ASSET_PREFIX_PLACEHOLDER=${NEXTJS_ASSET_PREFIX_PLACEHOLDER}

ARG BUILD_ID
ARG SENTRY_PROJECT=paths-ui
ARG SENTRY_RELEASE=${SENTRY_PROJECT}@${BUILD_ID}
ENV BUILD_ID=${BUILD_ID} SENTRY_RELEASE=${SENTRY_RELEASE}

WORKDIR /app

#
# NextJS builder
#
FROM nextjs_base AS builder

COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the files
COPY --exclude=docker --exclude=Dockerfile . .

# For Sentry source map upload
ARG SENTRY_PROJECT
ARG SENTRY_URL
ARG SENTRY_ORG

COPY docker/manage-nextjs-cache.sh /
# Remove the NextJS build cache if packages change
RUN --mount=type=cache,target=/app/.next/cache \
  /manage-nextjs-cache.sh check

# Build the NextJS bundle
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN --mount=type=cache,target=/app/.next/cache \
  SENTRY_PROJECT=${SENTRY_PROJECT} \
  SENTRY_URL=${SENTRY_URL} \
  SENTRY_ORG=${SENTRY_ORG} \
  NEXTJS_BUILD_ID=${BUILD_ID} \
  NEXTJS_ASSET_PREFIX=${NEXTJS_ASSET_PREFIX_PLACEHOLDER} \
  npm run build && /manage-nextjs-cache.sh save


FROM nextjs_base AS final

# Add nextjs user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs && chown nextjs:nodejs /app

RUN apk update && apk add --no-cache caddy multirun && rm -rf /var/cache/apk

# For non-standalone builds
# COPY --chown=nextjs:nodejs --from=deps /app/node_modules ./node_modules
# COPY --chown=nextjs:nodejs --from=builder /app/.next ./.next
# COPY --chown=nextjs:nodejs --from=builder /app/dist ./dist
# COPY --exclude=docker --exclude=Dockerfile --chown=nextjs:nodejs . .
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# For standalone builds
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY ./docker/start-server.sh /entrypoint.sh
COPY ./docker/Caddyfile /etc/caddy/

ARG BUILD_ID
ARG SENTRY_RELEASE
ARG SENTRY_PROJECT
ENV \
  SENTRY_RELEASE=${SENTRY_RELEASE} \
  BUILD_ID=${BUILD_ID} \
  NEXTJS_ASSET_PREFIX_PLACEHOLDER=${NEXTJS_ASSET_PREFIX_PLACEHOLDER} \
  SENTRY_PROJECT=${SENTRY_PROJECT} \
  APP_ROOT=/app

ARG NEXTJS_PORT=3000
ARG CADDY_PORT=3001
ARG METRICS_PORT=9464
ENV NEXTJS_PORT=${NEXTJS_PORT} CADDY_PORT=${CADDY_PORT} METRICS_PORT=${METRICS_PORT}

LABEL nextjs_build_id="${BUILD_ID}"

EXPOSE ${PORT} ${CADDY_PORT} ${METRICS_PORT}
ENTRYPOINT ["/entrypoint.sh"]
