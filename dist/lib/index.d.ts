export = Authenticator;
declare class Authenticator {
  constructor({
    prefix,
    http: { adapter, type },
    auth: {
      refreshTokenConfig,
      accessTokenConfig,
      identityField,
      credentialsField,
      findUserById,
      findUserByIdentifier,
      createUser,
      updateUserPassword,
      verifyUser,
    },
    mailOptions: {
      host,
      port,
      secure,
      auth,
      tls,
      verification,
      forgotPassword,
    },
    storage,
  }?: {
    prefix?: string;
    http: {
      adapter: any;
      type: "express" | "fastify";
    };
    auth: {
      refreshTokenConfig?: {
        property?: string;
        secret?: string;
        privateKey?: string;
        publicKey?: string;
        algorithms?: string[] | undefined;
        expirationInSeconds?: number;
      };
      accessTokenConfig?: {
        property?: string;
        secret?: string;
        privateKey?: string;
        publicKey?: string;
        algorithms?: string[] | undefined;
        expirationInSeconds?: number;
      };
      identityField?: string;
      credentialsField?: string;
      findUserById?: (identifier: any) => Promise<any>;
      findUserByIdentifier: (identifier: any) => Promise<any>;
      createUser: (data: any) => Promise<any>;
      updateUserPassword: (identifier: any, password: any) => Promise<any>;
      verifyUser: (identifier: any) => Promise<any>;
    };
    mailOptions?: {
      host: string;
      port: string | number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      tls?: {
        rejectUnauthorized: boolean;
      };
      verification?: {
        template?: string;
        disabled?: boolean;
        subject?: string;
        from?: string;
        ttl?: number;
        baseUrl: string;
      };
      forgotPassword?: {
        template?: string;
        disabled?: boolean;
        subject?: string;
        from?: string;
        ttl?: number;
        baseUrl: string;
      };
    };
    storage?: typeof MemoryStorage | any;
  });
  router: typeof Router;
  authService: typeof AuthService;
  config: {
    prefix?: string;
    http: {
      adapter: any;
      type: "express" | "fastify";
    };
    auth: {
      refreshTokenConfig: {
        property?: string;
        secret?: string;
        privateKey?: string;
        publicKey?: string;
        algorithms?: string[] | undefined;
        expirationInSeconds?: number;
      };
      accessTokenConfig?: {
        property?: string;
        secret?: string;
        privateKey?: string;
        publicKey?: string;
        algorithms?: string[] | undefined;
        expirationInSeconds?: number;
      };
      identityField: string;
      credentialsField: string;
      findUserById?: (identifier: string) => Promise<any>;
      findUserByIdentifier: (identifier: string) => Promise<any>;
      createUser: (data: any) => Promise<any>;
      updateUserPassword: (
        identifier: string,
        password: string
      ) => Promise<any>;
      verifyUser: (identifier: string) => Promise<any>;
    };
    mailOptions?: {
      host: string;
      port: string | number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      tls?: {
        rejectUnauthorized: boolean;
      };
      verification?: {
        template?: string;
        disabled?: boolean;
        subject?: string;
        from?: string;
        ttl?: number;
        baseUrl: string;
      };
      forgotPassword?: {
        template?: string;
        disabled?: boolean;
        subject?: string;
        from?: string;
        ttl?: number;
        baseUrl: string;
      };
    };
    storage?: typeof MemoryStorage | any;
  };
  isAuthenticated(): (req: any, res: any, next: any) => Promise<any>;
}
import Router = require("./router");
import AuthService = require("./auth");
import MemoryStorage = require("./storage");
