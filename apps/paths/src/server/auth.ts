import { Express } from 'express';
import {
  Issuer,
  Strategy,
  Client,
  TokenSet,
  StrategyOptions,
} from 'openid-client';
import { parse } from 'url';
import type {
  BaseServer,
  BaseServerRequest,
  BaseServerResponse,
} from 'server/common.js';
import { NextFunction } from 'express';
import { Authenticator } from 'passport';

export class ServerAuth {
  id: string;
  server: BaseServer;
  client: Client;

  constructor(
    server: BaseServer,
    req: BaseServerRequest,
    id: string,
    issuer: Issuer
  ) {
    this.server = server;
    this.id = id;

    const callbackPath = server.getPrefixedPath(req, '/auth/callback', false);

    const client = new issuer.Client({
      client_id: process.env.OIDC_CLIENT_ID!,
      client_secret: process.env.OIDC_SECRET!,
      redirect_uris: [`${req.currentURL.baseURL}${callbackPath}`],
    });
    this.client = client;
    this.verifyCallback = this.verifyCallback.bind(this);
    this.handleRequest = this.handleRequest.bind(this);
    const opts: StrategyOptions = {
      client,
      params: {
        scope: 'openid profile',
      },
    };
    const strategy = new Strategy(opts, this.verifyCallback.bind(this));
    server.passport.use(id, strategy);
  }

  handleRequest(
    req: BaseServerRequest,
    res: BaseServerResponse,
    normalizedPath: string,
    next: NextFunction
  ) {
    if (normalizedPath === '/auth') {
      this.server.passport.authenticate(this.id)(req, res, next);
    } else if (normalizedPath === '/auth/callback') {
      const failurePath = req.instanceIsProtected
        ? this.server.getPrefixedPath(req, '/auth/failed', false)
        : this.server.getPrefixedPath(req, '/', true);

      this.server.passport.authenticate(this.id, {
        successRedirect: this.server.getPrefixedPath(req, '/', true),
        failureRedirect: failurePath,
      })(req, res, next);
    } else if (normalizedPath === '/auth/logout') {
      req.logout((err) => {
        if (err) return next(err);
        const logoutPath = req.instanceIsProtected ? '/' : '/auth/protected';
        res.redirect(this.server.getPrefixedPath(req, logoutPath));
      });
    } else if (normalizedPath === '/auth/protected') {
      // FIXME
      res.status(200).send('Instance is protected');
    } else if (normalizedPath === '/auth/failed') {
      // FIXME
      res.status(403).send('Authentication failed');
    } else {
      res.status(404).send('Page not found');
    }
  }

  verifyCallback(tokenset: TokenSet, done: (err: any, user?: any) => void) {
    const user = {
      idToken: tokenset.id_token,
      ...tokenset.claims(),
    };
    done(null, user);
  }
}

export type ServerAuthIssuer = Issuer;

export async function initializeIssuer(apiUrl: string) {
  if (!process.env.OIDC_CLIENT_ID || !process.env.OIDC_SECRET) {
    console.log(
      '🚫 OIDC environment variables not set, disabling OIDC support'
    );
    return null;
  }
  const url = parse(apiUrl);
  const wkUrl = `${url.protocol}//${url.hostname}${
    url.port ? ':' + url.port : ''
  }/.well-known/openid-configuration/`;
  console.log(`🔒 Retrieving OpenID Connect Issuer metadata: ${wkUrl}`);
  const issuer = await Issuer.discover(wkUrl);
  return issuer;
}

export function initializePassport(app: Express) {
  const passport = new Authenticator();
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (user, done) {
    // @ts-ignore
    done(null, user);
  });

  return passport;
}
