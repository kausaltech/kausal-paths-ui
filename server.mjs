import path from "path";
import Koa from "koa";
import next from "next";
import Router from "@koa/router";
import logger from "koa-logger";
import dotenv from "dotenv";
import {
  ApolloClient, HttpLink, gql, InMemoryCache, defaultDataIdFromObject
} from '@apollo/client';


const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";

const GET_INSTANCE = gql`
query GetInstanceConfig($hostname: String, $identifier: String) @instance(identifier: $identifier, hostname: $hostname) {
  instance {
    id
    defaultLanguage
    supportedLanguages
    hostname(hostname: $hostname) {
      basePath
    }
  }
}`;

class PathsServer {
  constructor() {
    this.nextConfig = null;
    this.app = next({ dev });
    this.nextHandleRequest = this.app.getRequestHandler();
    this.instancesByHostname = new Map();
  }

  initApollo() {
    const uri = this.nextConfig.serverRuntimeConfig.graphqlUrl;
    const httpLink = new HttpLink({
      uri,
    });
    console.log(`> GraphQL API at ${uri}`);
    return new ApolloClient({
      ssrMode: true,
      link: httpLink,
      cache: new InMemoryCache(),
    });
  }

  async getInstance(ctx) {
    const { hostname } = ctx;
    const instance = this.instancesByHostname.get(hostname);
    if (instance) return instance;

    try {
      const { data } = await this.apolloClient.query({
        query: GET_INSTANCE,
        variables: {
          identifier: this.nextConfig.publicRuntimeConfig.instanceIdentifier,
          hostname: ctx.hostname,
        },
        fetchPolicy: 'no-cache',
      });
      this.instancesByHostname.set(hostname, data.instance);
      return data.instance;
    } catch (error) {
      console.error(error);
      ctx.throw(404, 'unknown hostname');
      return null;
    }
  }

  setBasePath(basePath) {
    const srv = this.nextServer;
    srv.nextConfig.basePath = basePath;
    srv.nextConfig.assetPrefix = basePath;
    srv.nextConfig.images.path = basePath + '/_next/image';
    srv.nextConfig.publicRuntimeConfig.basePath = basePath;
    srv.renderOpts.basePath = basePath;
    srv.renderOpts.canonicalBase = basePath;
    srv.renderOpts.runtimeConfig.basePath = basePath;
    srv.renderOpts.assetPrefix = basePath;
    srv.router.basePath = basePath;
  }

  setLocale(defaultLocale, locales) {
    const srv = this.nextServer;
    // Insert defaultLocale as the first element in locale list
    const loc = locales.filter((lang) => lang !== defaultLocale);
    loc.splice(0, 0, defaultLocale);
    srv.nextConfig.i18n.defaultLocale = defaultLocale;
    srv.nextConfig.i18n.locales = loc;
    srv.router.locales = loc;
    srv.incrementalCache.locales = loc;
  }

  async handleRequest(ctx) {
    const instance = await this.getInstance(ctx);
    if (!instance) return;
    const basePath = instance.basePath || '';
    this.setBasePath(basePath);
    this.setLocale(instance.defaultLanguage, instance.supportedLanguages)
    this.nextServer.nextConfig.publicRuntimeConfig.instance = instance;
    await this.nextHandleRequest(ctx.req, ctx.res);
    ctx.respond = false;
  }

  async init() {
    await this.app.prepare();
    this.nextConfig = (await import("next/config.js")).default.default();
    const router = new Router();
    const server = new Koa();
    this.apolloClient = this.initApollo();
    this.nextServer = await this.app.getServer();

    router.all("(.*)", this.handleRequest.bind(this));
    server.use(logger());
    server.use(async (ctx, next) => {
      ctx.res.statusCode = 200;
      await next();
    });
    server.use(router.routes());
    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  }
}

const pathsServer = new PathsServer();
pathsServer.init().then(() => {
  console.log('> Init done');
});
