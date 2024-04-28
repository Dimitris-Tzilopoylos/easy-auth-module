export = Router;
declare class Router {
    static adapter: typeof HttpAdapter;
    static toPrefixedRoute(prefix: any, route: any): string;
    static init({ prefix, http: { adapter, type }, auth: { refreshTokenConfig, accessTokenConfig, identityField, credentialsField, findUserById, findUserByIdentifier, createUser, updateUserPassword, verifyUser, }, mailOptions, storage, }?: {
        prefix: any;
        http: {
            adapter: any;
            type: any;
        };
        auth: {
            refreshTokenConfig: any;
            accessTokenConfig: any;
            identityField: any;
            credentialsField: any;
            findUserById: any;
            findUserByIdentifier: any;
            createUser: any;
            updateUserPassword: any;
            verifyUser: any;
        };
        mailOptions: any;
        storage?: typeof MemoryStorage;
    }): void;
    static isAuthenticated(): (req: any, res: any, next: any) => Promise<any>;
}
import HttpAdapter = require("./http-adapter");
import MemoryStorage = require("./storage");
