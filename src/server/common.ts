import express, { NextFunction, Request, Response } from 'express';
import { engine } from 'express-handlebars';
import cookieSession from 'cookie-session';

import type { Authenticator } from 'passport';
import asyncHandler from 'express-async-handler';
import originalUrl from 'original-url';
import {
  ApolloClient,
  NormalizedCacheObject,
  HttpLink,
  InMemoryCache,
  ApolloLink,
  FetchResult,
  NextLink,
  Observable,
  Operation,
} from '@apollo/client/index.js';
import 'dotenv/config';

import next from 'next/dist/server/next.js';

console.log('> 💡 Starting server');

import Sentry from '@sentry/nextjs';
import '../../sentry.server.config.js';
import { NextServer, RequestHandler } from 'next/dist/server/next.js';
import * as NextNodeServer from 'next/dist/server/next-server.js';
import {
  initializeIssuer,
  initializePassport,
  ServerAuth,
  ServerAuthIssuer,
} from './auth.js';
import { logRequest } from './log.js';
import { getErrorMessages, ErrorTemplateContext } from './errors.js';
import { SentryLink } from 'apollo-link-sentry';

if (process.env.SENTRY_DSN) {
  console.log(`> ⚙️ Sentry initialized at ${process.env.SENTRY_DSN}`);
}

const defaultFallbackLanguage = process.env.DEFAULT_LANGUAGE ?? 'en';

export const deploymentType = process.env.DEPLOYMENT_TYPE || 'development';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const dev = process.env.NODE_ENV !== 'production';

if (!process.env.SESSION_SECRET && deploymentType !== 'development') {
  console.warn('SESSION_SECRET not set, using unsafe default');
}
const sessionSecret = process.env.SESSION_SECRET || 'secretsecret';

export class InstanceNotFoundError extends Error {}

export type BaseServerRequest = Request & {
  currentURL: {
    baseURL: string;
    path: string;
    hostname: string;
  };
  nextBasePath: string;
  nextDefaultLanguage: string;
  nextSupportedLanguages: Array<string>;
  nextCurrentLanguage: string;
  instanceIsProtected: boolean;
};

export type RequestContext = {
  basePath: string;
  defaultLanguage: string;
  supportedLanguages: Array<string>;
  isProtected: boolean;
  other: {
    [key: string]: any;
  };
};

export type BaseServerResponse = Response;

/*
class SentryLink extends ApolloLink {
  constructor() {
    super();
  }
  request(operation: Operation, forward?: NextLink | undefined): Observable<FetchResult> | null {
    if (!forward) return null;
    const hub = Sentry.getCurrentHub();
    const scope = hub.pushScope();
    scope.setTransactionName(operation.operationName);
    scope.setContext('variables', operation.variables);
    const ret = forward(operation);
    hub.popScope();
    return ret;
  }

}
*/

export abstract class BaseServer {
  name: string;
  nextConfig: any;
  nextApp: NextServer;
  nextServer: NextNodeServer.default;
  nextHandleRequest: RequestHandler;
  apolloClient: ApolloClient<NormalizedCacheObject>;
  passport: Authenticator;
  authIssuer: ServerAuthIssuer | null;
  Sentry: typeof Sentry;
  dev: boolean;

  constructor() {
    this.nextConfig = null;
    // @ts-ignore 2349
    this.nextApp = next({ dev, hostname: 'localhost', port: 3000 });
    this.nextHandleRequest = this.nextApp.getRequestHandler();
    this.Sentry = Sentry;
    this.dev = dev;
  }

  getCurrentURL(req: Request) {
    const obj = originalUrl(req);
    let port: string;

    if (obj.protocol === 'http:' && obj.port === 80) {
      port = '';
    } else if (obj.protocol === 'https:' && obj.port === 443) {
      port = '';
    } else {
      port = `:${obj.port}`;
    }
    const path = (obj.pathname || '').replace(/\/$/, ''); // strip trailing slash
    const baseURL = `${obj.protocol}//${obj.hostname}${port}`;
    const hostname = obj.hostname!;
    return { baseURL, path, hostname };
  }

  initApollo(apiUrl: string) {
    const httpLink = new HttpLink({
      uri: apiUrl,
    });
    console.log(`> GraphQL API at ${apiUrl}`);
    const client = new ApolloClient({
      ssrMode: true,
      link: ApolloLink.from([
        new SentryLink({
          uri: apiUrl,
          setTransaction: false,
          attachBreadcrumbs: {
            includeVariables: true,
            includeError: true,
          },
        }),
        httpLink,
      ]),
      cache: new InMemoryCache(),
    });
    return client;
  }

  setBasePath(req: BaseServerRequest, basePath: string) {
    const srv: any = this.nextServer;

    if (basePath && basePath.endsWith('/')) basePath.slice(0, -1);
    srv.nextConfig.basePath = basePath;
    srv.nextConfig.assetPrefix = basePath;
    srv.nextConfig.images.path = basePath + '/_next/image';
    srv.nextConfig.publicRuntimeConfig.basePath = basePath;
    srv.renderOpts.basePath = basePath;
    srv.renderOpts.canonicalBase = basePath;
    //srv.renderOpts.runtimeConfig.basePath = basePath;
    srv.renderOpts.assetPrefix = basePath;

    req.nextBasePath = basePath;
  }

  setLocale(
    req: BaseServerRequest,
    defaultLocale: string,
    locales: Array<string>
  ) {
    const srv: any = this.nextServer;
    // Insert defaultLocale as the first element in locale list
    const loc = locales.filter((lang) => lang !== defaultLocale);
    loc.splice(0, 0, defaultLocale);
    srv.nextConfig.i18n.defaultLocale = defaultLocale;
    srv.nextConfig.i18n.locales = loc;
    srv.localeNormalizer.locales = loc;
    srv.localeNormalizer.defaultLocale = defaultLocale;
    srv.localeNormalizer.lowerCase = loc.map((l) => l.toLowerCase());
  }

  abstract getRequestContext(
    req: BaseServerRequest,
    res: BaseServerResponse
  ): Promise<RequestContext | null>;
  abstract getRequestAuth(
    req: BaseServerRequest,
    res: BaseServerResponse
  ): ServerAuth | null;

  processPath(req: BaseServerRequest) {
    const basePath = req.nextBasePath || '/';
    const requestPath = req.currentURL.path || '/';
    const path = requestPath.slice(basePath.length);
    const parts = path.split('/');

    if (!requestPath.startsWith(basePath)) {
      return null;
    }

    req.nextCurrentLanguage = req.nextDefaultLanguage;
    // Strip the language prefix for multilingual sites
    if (req.nextSupportedLanguages.length > 1) {
      const prefixedLocales = req.nextSupportedLanguages.filter(
        (lang) => lang != req.nextDefaultLanguage
      );
      const localeMatch = prefixedLocales.find((lang) => parts[0] === lang);
      if (localeMatch) {
        req.nextCurrentLanguage = localeMatch;
        parts.shift();
      }
    }
    return '/' + parts.join('/');
  }

  getPrefixedPath(
    req: BaseServerRequest,
    path: string,
    includeLocale: boolean = true
  ) {
    const localePrefix =
      req.nextCurrentLanguage === req.nextDefaultLanguage
        ? ''
        : `/${req.nextCurrentLanguage}`;
    return `${req.nextBasePath}${includeLocale ? localePrefix : ''}${path}`;
  }

  sendError(
    req: BaseServerRequest,
    res: Response,
    statusCode: number,
    msg: string
  ) {}

  async handleRequest(
    req: BaseServerRequest,
    res: Response,
    next: NextFunction
  ) {
    req.currentURL = this.getCurrentURL(req);
    if (req.currentURL.path === '/_health') {
      res.status(200).send('OK');
      return;
    }
    let ctx: RequestContext | null;
    try {
      ctx = await this.getRequestContext(req, res);
    } catch (error) {
      next(error);
      return;
    }
    if (!ctx) {
      if (!res.headersSent) {
        res.status(404).send('Page not found');
      }
      return;
    }

    const { basePath, defaultLanguage, supportedLanguages, isProtected } = ctx;
    req.nextBasePath = basePath;
    req.nextDefaultLanguage = defaultLanguage;
    req.nextSupportedLanguages = supportedLanguages;
    req.instanceIsProtected = isProtected;
    Object.assign(req, ctx.other);

    const normalizedPath = this.processPath(req);
    if (!normalizedPath) {
      res.status(404).send('Page not found');
      return;
    }
    if (normalizedPath.match(/^\/auth(\/|$)/)) {
      if (!this.authIssuer) {
        console.warn('Authentication request, but no auth issuer configured');
        res.status(404).send('Auth requests not possible');
        return;
      }
      const auth = this.getRequestAuth(req, res);
      if (!auth) {
        console.warn('Authentication request, but no auth client available');
        res.status(404).send('Auth requests not possible');
        return;
      }
      auth.handleRequest(req, res, normalizedPath, next);
      return;
    }

    this.setBasePath(req, basePath);
    this.setLocale(req, defaultLanguage, supportedLanguages);
    res.set('Document-Policy', 'js-profiling');
    // In production, we instruct upstream caches to also cache our static files
    if (
      normalizedPath.match(/^\/static\//) &&
      process.env.DEPLOYMENT_TYPE === 'production'
    ) {
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=1800, stale-while-revalidate=59'
      );
    }
    await this.nextHandleRequest(req, res);
  }

  async init() {
    console.log('> ⚙️ Preparing NextJS');
    await this.nextApp.prepare();

    this.nextConfig = (await import('next/config.js')).default.default();
    const apiUrl = this.nextConfig.serverRuntimeConfig.graphqlUrl;
    const app = express();
    const sentryClient = Sentry.getCurrentHub().getClient();
    if (sentryClient && sentryClient.addIntegration) {
      sentryClient.addIntegration(
        new Sentry.Integrations.Express({
          app,
        })
      );
    }
    app.use(
      Sentry.Handlers.requestHandler({
        include: {
          ip: true,
        },
      })
    );
    app.use(Sentry.Handlers.tracingHandler());

    app.engine('handlebars', engine());
    app.set('view engine', 'handlebars');
    app.set('views', './src/server/views');

    this.apolloClient = this.initApollo(apiUrl);
    try {
      this.authIssuer = await initializeIssuer(apiUrl);
    } catch (error) {
      this.Sentry.captureException(error);
      console.error(error);
      this.authIssuer = null;
    }

    // @ts-expect-error 2341
    this.nextServer = await this.nextApp.getServer();

    app.use(logRequest);
    app.use(
      cookieSession({
        name: this.name,
        keys: [sessionSecret],
        secure: !dev,
        maxAge: 7 * 24 * 3600 * 1000, // 7 days
      })
    );

    // register regenerate & save after the cookieSession middleware initialization
    // cf. https://github.com/jaredhanson/passport/issues/904
    app.use(function (req, res, next) {
      if (req.session && !req.session.regenerate) {
        req.session.regenerate = ((cb) => {
          cb(null);
          return this;
        }).bind(req.session);
      }
      if (req.session && !req.session.save) {
        req.session.save = ((cb) => {
          cb(null);
          return this;
        }).bind(req.session);
      }
      next();
    });

    // @ts-ignore
    this.passport = initializePassport(app);

    const handler = asyncHandler(this.handleRequest.bind(this));
    app.all('*', (req, res, next) => {
      return Sentry.runWithAsyncContext(() => {
        return handler(req, res, next);
      });
    });

    app.use(
      Sentry.Handlers.errorHandler({
        /*shouldHandleError: (error) => {
        console.log('should handle 404?');
        return true;
      }*/
      })
    );
    app.use((err, req, res, next) => {
      if (res.headersSent) return next(err);
      let context: ErrorTemplateContext;
      if (err instanceof InstanceNotFoundError) {
        context = getErrorMessages(defaultFallbackLanguage, 'notFound');
        res.status(404);
      } else {
        context = getErrorMessages(defaultFallbackLanguage, 'genericError');
        res.status(500);
      }
      if (process.env.DEPLOYMENT_TYPE !== 'production') {
        context.fullError = err.toString();
      }
      res.render('error', context);
    });
    app.listen(port, () => {
      console.log(`> ✅ Ready on http://localhost:${port}`);
    });
  }
}
