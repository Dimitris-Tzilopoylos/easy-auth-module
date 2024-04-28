export = AuthService;
declare class AuthService {
    static mail: any;
    static allowedAlgorithms: string[];
    static eventNames: {
        sendVerificationMail: string;
        sendForgotPasswordRequestMail: string;
    };
    static events: AuthEvents;
    static config: {
        identityField: string;
        credentialsField: string;
        findUserByIdentifier: (identifier: any) => Promise<any>;
        findUserById: (identifier: any) => Promise<any>;
        createUser: (data: any) => Promise<any>;
        updateUserPassword: (identifier: any, data: any) => Promise<any>;
        verifyUser: (identifier: any) => Promise<any>;
        mailOptions: {
            verification: {
                template: any;
                disabled: boolean;
                subject: string;
                from: string;
            };
            forgotPassword: {
                disabled: boolean;
                subject: string;
                from: string;
                template: any;
            };
        };
        accessTokenConfig: {
            property: string;
            secret: string;
            privateKey: any;
            publicKey: any;
            algorithms: any;
            expirationInSeconds: number;
        };
        refreshTokenConfig: {
            property: string;
            secret: string;
            privateKey: any;
            publicKey: any;
            algorithms: any;
            expirationInSeconds: number;
        };
        storage: typeof MemoryStorage;
    };
    static verifyAccount(req: any): Promise<any>;
    static resendVerification(payload: any): Promise<any>;
    static sendForgotPasswordRequest(payload: any): Promise<any>;
    static forgotPassword(req: any): Promise<any>;
    static login(payload: any): Promise<{
        [x: string]: any;
    }>;
    static register(payload: any): Promise<any>;
    static isAuthenticated(req: any): Promise<any>;
    static updatePassword(req: any): Promise<any>;
    static refreshToken(payload: any): Promise<{
        [x: string]: any;
    }>;
    static comparePassword(password: any, user: any): Promise<any>;
    static hashPassword(user: any): Promise<any>;
    static getBearerToken(req: any): any;
    static verifyAccessToken(token: any): any;
    static verifyRefreshToken(token: any): any;
    static toVerificationConfig(type: any): {
        secret: any;
        algorithms: any;
    };
    static toSignTokenConfig(type: any): {
        secret: any;
        algorithms: any;
        expiresIn: any;
    };
    static toSanitizedUser(user: any): any;
    static getConfigByTokenType(type: any): any;
    static signToken(type: any, payload: any): any;
    static signAccessToken(user: any): any;
    static signRefreshToken(user: any): any;
    static getRefreshTokenPropertyKey(): string;
    static getAccessTokenPropertyKey(): string;
    static getSignedTokens(user: any): {
        [x: string]: any;
    };
    static validateConfig(): void;
    static validateTokenConfig(config: any): boolean;
    static init({ identityField, credentialsField, refreshTokenConfig, accessTokenConfig, findUserByIdentifier, findUserById, createUser, updateUserPassword, verifyUser, mailOptions, }?: {
        identityField: any;
        credentialsField: any;
        refreshTokenConfig: any;
        accessTokenConfig: any;
        findUserByIdentifier: any;
        findUserById: any;
        createUser: any;
        updateUserPassword: any;
        verifyUser: any;
        mailOptions: any;
    }): void;
    static publishSendVerificationMailEvent(data: any): void;
    static publishSendForgotPasswordMailEvent(data: any): void;
    static toForgotPasswordKey(key: any): string;
    static toVerifyAccountKey(key: any): string;
}
import AuthEvents = require("./events");
import MemoryStorage = require("./storage");
