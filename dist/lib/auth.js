"use strict";

const HttpAdapter = require("./http-adapter");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ValidationService = require("easy-validation-service");
const AuthEvents = require("./events");
const Mail = require("./mail");
const path = require("path");
const fs = require("fs");
const {
  v4
} = require("uuid");
const MemoryStorage = require("./storage");
const {
  InternalServer,
  BadRequest,
  Unauthorized
} = require("./errors");
class AuthService {
  static mail;
  static allowedAlgorithms = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512", "none"];
  static eventNames = {
    sendVerificationMail: "sendVerificationMail",
    sendForgotPasswordRequestMail: "sendForgotPasswordRequestMail"
  };
  static events = new AuthEvents();
  static config = {
    identityField: "email",
    credentialsField: "password",
    findUserByIdentifier: async identifier => null,
    findUserById: async identifier => null,
    createUser: async data => null,
    updateUserPassword: async (identifier, data) => null,
    verifyUser: async identifier => null,
    mailOptions: {
      verification: {
        template: path.join(__dirname, "templates", "verify-account.ejs"),
        disabled: false,
        subject: "Verify your account",
        from: "",
        ttl: 60 * 5
      },
      forgotPassword: {
        disabled: false,
        subject: "Change your password",
        from: "",
        template: path.join(__dirname, "templates", "forgot-password.ejs"),
        ttl: 60 * 5
      }
    },
    accessTokenConfig: {
      property: "accessToken",
      secret: "access-secret",
      privateKey: null,
      publicKey: null,
      algorithms: undefined,
      expirationInSeconds: 5 * 3 * 60
    },
    refreshTokenConfig: {
      property: "refreshToken",
      secret: "refresh-secret",
      privateKey: null,
      publicKey: null,
      algorithms: undefined,
      expirationInSeconds: 5 * 60 * 60
    },
    storage: MemoryStorage
  };
  static async verifyAccount(req) {
    const {
      id
    } = req.params;
    const identifier = await AuthService.config.storage.get(id);
    if (!identifier) {
      throw new BadRequest();
    }
    const user = await AuthService.config.verifyUser(identifier);
    if (!user) {
      throw new InternalServer();
    }
    await Promise.allSettled([AuthService.config.storage.delete(id), AuthService.config.storage.delete(AuthService.toVerifyAccountKey(identifier))]);
    return AuthService.toSanitizedUser(user);
  }
  static async resendVerification(payload) {
    const user = await AuthService.config.findUserByIdentifier(payload[AuthService.config.identityField]);
    if (!user) {
      throw new InternalServer();
    }
    AuthService.publishSendVerificationMailEvent(user);
    return AuthService.toSanitizedUser(user);
  }
  static async sendForgotPasswordRequest(payload) {
    const user = await AuthService.config.findUserByIdentifier(payload[AuthService.config.identityField]);
    if (!user) {
      throw new InternalServer();
    }
    AuthService.publishSendForgotPasswordMailEvent(user);
    return AuthService.toSanitizedUser(user);
  }
  static async forgotPassword(req) {
    const {
      id
    } = req.params;
    const {
      verifyPassword,
      password
    } = req.body;
    const identifier = await AuthService.config.storage.get(id);
    if (!identifier) {
      throw new BadRequest();
    }
    if (!ValidationService.validateBody({
      password,
      verifyPassword
    }, {
      password: (value, data) => value === data.verifyPassword && ValidationService.validateString({
        value,
        min: 1,
        noWhiteSpace: true
      })
    })) {
      throw new BadRequest();
    }
    const authenticatedUser = await AuthService.config.findUserByIdentifier(identifier);
    if (!authenticatedUser) {
      throw new BadRequest();
    }
    const newHash = await AuthService.hashPassword({
      [AuthService.config.credentialsField]: password
    });
    if (!newHash) {
      throw new InternalServer();
    }
    const updatedUser = await AuthService.config.updateUserPassword(identifier, newHash);
    if (!updatedUser) {
      throw new InternalServer("User was not updated");
    }
    await Promise.allSettled([AuthService.config.storage.delete(id), AuthService.config.storage.delete(AuthService.toForgotPasswordKey(identifier))]);
    return AuthService.toSanitizedUser(updatedUser);
  }
  static async login(payload) {
    const {
      [AuthService.config.identityField]: identifier
    } = payload;
    const user = await AuthService.config.findUserByIdentifier(identifier);
    if (!user) {
      throw new Error("User not found");
    }
    const isAuthenticated = await AuthService.comparePassword(payload[AuthService.config.credentialsField], user);
    if (!isAuthenticated) {
      throw new Unauthorized();
    }
    return AuthService.getSignedTokens(user);
  }
  static async register(payload) {
    const hashedPWD = await AuthService.hashPassword(payload);
    if (!hashedPWD) {
      throw new Error("Failed to hash password");
    }
    const body = {
      ...payload,
      [AuthService.config.credentialsField]: hashedPWD
    };
    const user = await AuthService.config.createUser(body);
    if (!user) {
      throw new Error("Registration failed: No user was created");
    }

    // send mail
    AuthService.publishSendVerificationMailEvent(user);
    return AuthService.toSanitizedUser(user);
  }
  static async isAuthenticated(req) {
    const token = AuthService.getBearerToken(req);
    if (!token) {
      throw new Error("Unauthorized");
    }
    const user = AuthService.verifyAccessToken(token);
    const authenticatedUser = await AuthService.config.findUserByIdentifier(user[AuthService.config.identityField]);
    if (!authenticatedUser) {
      throw new Error("Unauthorized");
    }
    return authenticatedUser;
  }
  static async updatePassword(req) {
    const user = await AuthService.isAuthenticated(req);
    const {
      oldPassword,
      password,
      verifyPassword
    } = req.body;
    if (!ValidationService.validateBody({
      oldPassword,
      password,
      verifyPassword
    }, {
      oldPassword: (value, data) => value !== data.password && ValidationService.validateString({
        value,
        min: 1,
        noWhiteSpace: true
      }),
      password: (value, data) => value === data.verifyPassword && ValidationService.validateString({
        value,
        min: 1,
        noWhiteSpace: true
      })
    })) {
      throw new Error("Bad request");
    }
    const authenticatedUser = await AuthService.config.findUserByIdentifier(user[AuthService.config.identityField]);
    if (!authenticatedUser) {
      throw new Error("Bad request");
    }
    const oldPasswordMatch = await AuthService.comparePassword(oldPassword, authenticatedUser);
    if (!oldPasswordMatch) {
      throw new BadRequest("");
    }
    const newHash = await AuthService.hashPassword({
      [AuthService.config.credentialsField]: password
    });
    if (!newHash) {
      throw new Error("Internal server error");
    }
    const updatedUser = await AuthService.config.updateUserPassword(authenticatedUser[AuthService.config.identityField], newHash);
    if (!updatedUser) {
      throw new Error("User was not updated");
    }
    return AuthService.toSanitizedUser(updatedUser);
  }
  static async refreshToken(payload) {
    const result = AuthService.verifyRefreshToken(payload[AuthService.getRefreshTokenPropertyKey()]);
    const user = await AuthService.config.findUserByIdentifier(result[AuthService.config.identityField]);
    if (!user) {
      throw new Error("Bad request");
    }
    return AuthService.getSignedTokens(user);
  }
  static async comparePassword(password, user) {
    return await bcrypt.compare(password, user[AuthService.config.credentialsField]);
  }
  static async hashPassword(user) {
    return await bcrypt.hash(user[AuthService.config.credentialsField], 10);
  }
  static getBearerToken(req) {
    try {
      const token = HttpAdapter.getHeaders(req)["authorization"].split("Bearer ").pop();
      if (!token) {
        throw new Error();
      }
      return token;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static verifyAccessToken(token) {
    const config = AuthService.toVerificationConfig("access");
    const {
      secret,
      algorithms
    } = config;
    const payload = jwt.verify(token, secret, {
      algorithms
    });
    return payload;
  }
  static verifyRefreshToken(token) {
    const config = AuthService.toVerificationConfig("refresh");
    const {
      secret,
      algorithms
    } = config;
    const payload = jwt.verify(token, secret, {
      algorithms
    });
    return payload;
  }
  static toVerificationConfig(type) {
    const config = AuthService.getConfigByTokenType(type);
    const {
      secret,
      publicKey,
      privateKey,
      algorithms
    } = config;
    return {
      secret: publicKey || secret,
      algorithms: secret ? undefined : algorithms
    };
  }
  static toSignTokenConfig(type) {
    const config = AuthService.getConfigByTokenType(type);
    const {
      secret,
      privateKey,
      algorithms,
      expirationInSeconds
    } = config;
    return {
      secret: privateKey || secret,
      algorithms: secret ? undefined : algorithms,
      expiresIn: expirationInSeconds
    };
  }
  static toSanitizedUser(user) {
    const {
      [AuthService.config.credentialsField]: _,
      ...rest
    } = user;
    return rest;
  }
  static getConfigByTokenType(type) {
    const config = AuthService.config[`${type}TokenConfig`];
    if (!config) {
      throw new Error();
    }
    if (!config.secret && (!config.privateKey || !config.publicKey)) {
      throw new Error(`Please provide the secret or private and public keys for ${type}Token`);
    }
    if (config.privateKey && config.privateKey) {
      if (!config.algorithms.length) {
        throw new Error(`Please provider an array of the following algorithms ${AuthService.allowedAlgorithms.join(",")}`);
      }
      const {
        secret,
        ...rest
      } = config;
      return rest;
    }
    const {
      publicKey,
      privateKey,
      ...rest
    } = config;
    return rest;
  }
  static signToken(type, payload) {
    const {
      secret,
      algorithms,
      expiresIn
    } = AuthService.toSignTokenConfig(type);
    const signedJWT = jwt.sign(AuthService.toSanitizedUser(payload), secret, {
      ...(algorithms && algorithms.length && {
        algorithm: algorithms[0]
      }),
      expiresIn
    });
    return signedJWT;
  }
  static signAccessToken(user) {
    if (!user) {
      throw new Error("No user provided to access token sign process");
    }
    return AuthService.signToken("access", user);
  }
  static signRefreshToken(user) {
    if (!user) {
      throw new Error("No user provided to refresh token sign process");
    }
    return AuthService.signToken("refresh", user);
  }
  static getRefreshTokenPropertyKey() {
    return AuthService.config.refreshTokenConfig.property || "refreshToken";
  }
  static getAccessTokenPropertyKey() {
    return AuthService.config.accessTokenConfig.property || "accessToken";
  }
  static getSignedTokens(user) {
    return {
      [AuthService.getRefreshTokenPropertyKey()]: AuthService.signRefreshToken(user),
      [AuthService.getAccessTokenPropertyKey()]: AuthService.signAccessToken(user)
    };
  }
  static validateConfig() {
    const {
      accessTokenConfig,
      refreshTokenConfig,
      identityField,
      credentialsField,
      findUserById,
      findUserByIdentifier,
      createUser,
      updateUserPassword,
      verifyUser
    } = AuthService.config;
    if (typeof identityField !== "string" || typeof credentialsField !== "string" || !identityField.trim() || !credentialsField.trim() || identityField.trim() === credentialsField.trim()) {
      throw new Error("Invalid user identity config");
    }
    if ([findUserById, findUserByIdentifier, createUser, updateUserPassword, verifyUser].some(x => typeof x !== "function")) {
      throw new Error("Please provide async functions for each of the following: findUserById, findUserByIdentifier, createUser, updateUserPassword, verifyUser");
    }
    const isValid = [accessTokenConfig, refreshTokenConfig].every(config => AuthService.validateTokenConfig(config));
    if (!isValid) {
      throw new Error("Please check again access and refresh token config");
    }
    if (!AuthService.config.mailOptions || Object.values(AuthService.config.mailOptions).some(({
      template
    }) => !fs.existsSync(template))) {
      throw new Error("Mail options are invalid");
    }
  }
  static validateTokenConfig(config) {
    return (config.privateKey && config.publicKey && [config.publicKey, config.privateKey].every(x => typeof x === "string" && !!x.trim()) || typeof config.secret === "string" && !!config.secret.trim()) && (typeof config.algorithms === "undefined" || Array.isArray(config.algorithms) && config.algorithms.length > 0 && config.algorithms.every(alg => AuthService.allowedAlgorithms.some(x => x === alg))) && (typeof config.expirationInSeconds === "number" && config.expirationInSeconds >= 0 || typeof expirationInSeconds === "undefined");
  }
  static init({
    identityField,
    credentialsField,
    refreshTokenConfig,
    accessTokenConfig,
    findUserByIdentifier,
    findUserById,
    createUser,
    updateUserPassword,
    verifyUser,
    mailOptions
  } = {}) {
    AuthService.config = {
      ...AuthService.config,
      identityField: (identityField || AuthService.config.identityField).trim(),
      credentialsField: (credentialsField || AuthService.config.credentialsField).trim(),
      accessTokenConfig: {
        ...AuthService.config.accessTokenConfig,
        ...(accessTokenConfig && accessTokenConfig)
      },
      refreshTokenConfig: {
        ...AuthService.config.refreshTokenConfig,
        ...(refreshTokenConfig && refreshTokenConfig)
      },
      findUserByIdentifier: findUserByIdentifier || AuthService.config.findUserByIdentifier,
      findUserById: findUserById || AuthService.config.findUserById,
      createUser: createUser || AuthService.config.createUser,
      updateUserPassword: updateUserPassword || AuthService.config.updateUserPassword,
      verifyUser: verifyUser || AuthService.config.verifyUser
    };
    if (mailOptions && ValidationService.isObject(mailOptions)) {
      const {
        verification,
        forgotPassword,
        ...rest
      } = mailOptions;
      AuthService.mail = new Mail(rest);
      if (AuthService.mail.isConfigured) {
        AuthService.config.mailOptions = {
          forgotPassword: {
            ...AuthService.config.mailOptions.forgotPassword,
            ...forgotPassword
          },
          verification: {
            ...AuthService.config.mailOptions.verification,
            ...verification
          }
        };
      }
    }
    if (AuthService.mail && AuthService.mail.isConfigured) {
      if (!AuthService.config.mailOptions.forgotPassword.disabled) {
        AuthService.events.subscribeAsync(AuthService.eventNames.sendForgotPasswordRequestMail, async data => {
          try {
            const {
              [AuthService.config.identityField]: identifier
            } = data;
            const identifierKey = AuthService.toForgotPasswordKey(identifier);
            const alreadySent = await AuthService.config.storage.get(identifierKey);
            if (alreadySent) {
              throw new Error(`Forgot Password Request already sent, try again later`);
            }
            const token = AuthService.toForgotPasswordKey(v4());
            const baseUrl = `${AuthService.config.mailOptions.forgotPassword.baseUrl}`;
            const url = baseUrl.endsWith("/") ? `${baseUrl}${token}` : `${baseUrl}/${token}`;
            data.forgotPassword = {
              url
            };
            await Promise.all([AuthService.config.storage.setWithTTL(token, identifier, AuthService.config.mailOptions.forgotPassword.ttl || -1), AuthService.config.storage.setWithTTL(identifierKey, identifier, AuthService.config.mailOptions.forgotPassword.ttl || -1)]);
            await AuthService.mail.sendHtmlMailByPath({
              from: AuthService.config.mailOptions.forgotPassword.from || AuthService.mail.transporterOptions.user,
              to: data[AuthService.config.identityField],
              subject: AuthService.config.mailOptions.forgotPassword.subject || "Change your password",
              filename: AuthService.config.mailOptions.forgotPassword.template,
              templateData: data
            });
          } catch (error) {
            console.log(error);
          }
        });
      }
      if (!AuthService.config.mailOptions.verification.disabled) {
        AuthService.events.subscribeAsync(AuthService.eventNames.sendVerificationMail, async data => {
          try {
            const {
              [AuthService.config.identityField]: identifier
            } = data;
            const identifierKey = AuthService.toVerifyAccountKey(identifier);
            const alreadySent = await AuthService.config.storage.get(identifierKey);
            if (alreadySent) {
              throw new Error(`Verification already sent, try again later`);
            }
            const token = AuthService.toVerifyAccountKey(v4());
            const baseUrl = `${AuthService.config.mailOptions.verification.baseUrl}`;
            const verificationEmailUrl = baseUrl.endsWith("/") ? `${baseUrl}${token}` : `${baseUrl}/${token}`;
            data.verification = {
              url: verificationEmailUrl
            };
            await Promise.all([AuthService.config.storage.setWithTTL(token, identifier, AuthService.config.mailOptions.verification.ttl || -1), AuthService.config.storage.setWithTTL(identifierKey, identifier, AuthService.config.mailOptions.verification.ttl || -1)]);
            await AuthService.mail.sendHtmlMailByPath({
              from: AuthService.config.mailOptions.verification.from || AuthService.mail.transporterOptions.user,
              to: data[AuthService.config.identityField],
              subject: AuthService.config.mailOptions.verification.subject || "Verify your account",
              filename: AuthService.config.mailOptions.verification.template,
              templateData: data
            });
          } catch (error) {
            console.log(error);
          }
        });
      }
    }
    AuthService.validateConfig();
    if (!AuthService.config.storage) {
      console.warn(`Missing storage class will result to invalid forgot password and/or verify account behaviour`);
    }
  }
  static publishSendVerificationMailEvent(data) {
    if (AuthService.mail && AuthService.mail.isConfigured && !AuthService.config.mailOptions.verification.disabled) {
      AuthService.events.publish(AuthService.eventNames.sendVerificationMail, AuthService.toSanitizedUser(data));
    }
  }
  static publishSendForgotPasswordMailEvent(data) {
    if (AuthService.mail && AuthService.mail.isConfigured && !AuthService.config.mailOptions.forgotPassword.disabled) {
      AuthService.events.publish(AuthService.eventNames.sendForgotPasswordRequestMail, AuthService.toSanitizedUser(data));
    }
  }
  static toForgotPasswordKey(key) {
    return `fp-${key}`;
  }
  static toVerifyAccountKey(key) {
    return `va-${key}`;
  }
}
module.exports = AuthService;