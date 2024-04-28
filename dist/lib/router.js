"use strict";

const AuthService = require("./auth");
const Controllers = require("./controllers");
const HttpAdapter = require("./http-adapter");
const MemoryStorage = require("./storage");
class Router {
  static adapter = HttpAdapter;
  static toPrefixedRoute(prefix, route) {
    let formattedPrefix = typeof prefix === "string" ? prefix.trim() : "";
    if (!route || typeof route !== "string") {
      route = "/";
    }
    if (!formattedPrefix.startsWith("/")) {
      formattedPrefix = "/" + formattedPrefix;
    }
    if (formattedPrefix.endsWith("/") && formattedPrefix !== "/") {
      formattedPrefix = formattedPrefix.substring(0, formattedPrefix.length - 1);
    }
    let formattedRoute = route.trim();
    if (formattedRoute.startsWith("/")) {
      formattedRoute = formattedRoute.substring(1);
    }
    if (formattedRoute.endsWith("/") && formattedRoute !== "/") {
      formattedRoute = formattedRoute.substring(0, formattedPrefix.length - 1);
    }
    return `${formattedPrefix === "/" ? "" : formattedPrefix}${formattedRoute.startsWith("/") ? formattedRoute : `/${formattedRoute}`}`;
  }
  static init({
    prefix,
    http: {
      adapter,
      type
    },
    auth: {
      refreshTokenConfig,
      accessTokenConfig,
      identityField,
      credentialsField,
      findUserById,
      findUserByIdentifier,
      createUser,
      updateUserPassword,
      verifyUser
    },
    mailOptions,
    storage = MemoryStorage
  } = {}) {
    HttpAdapter.setAdapther(type, adapter);
    AuthService.init({
      identityField,
      createUser,
      credentialsField,
      findUserById,
      findUserByIdentifier,
      updateUserPassword,
      verifyUser,
      refreshTokenConfig,
      accessTokenConfig,
      mailOptions,
      storage
    });
    HttpAdapter.get(Router.toPrefixedRoute(prefix, "/"), Controllers.getMeController);
    HttpAdapter.post(Router.toPrefixedRoute(prefix, "/login"), Controllers.loginController);
    HttpAdapter.post(Router.toPrefixedRoute(prefix, "/register"), Controllers.registerController);
    HttpAdapter.post(Router.toPrefixedRoute(prefix, "/refresh-token"), Controllers.refreshTokenController);
    HttpAdapter.post(Router.toPrefixedRoute(prefix, "/forgot-password"), Controllers.sendForgotPasswordRequestController);
    HttpAdapter.post(Router.toPrefixedRoute(prefix, "/forgot-password/:id"), Controllers.forgotPasswordController);
    HttpAdapter.post(Router.toPrefixedRoute(prefix, "/change-password"), Controllers.updatePasswordController);
    HttpAdapter.get(Router.toPrefixedRoute(prefix, "/verify/:id"), Controllers.verifyAccountController);
    HttpAdapter.post(Router.toPrefixedRoute(prefix, "/verify"), Controllers.resendVerificationController);
  }
  static isAuthenticated() {
    return Controllers.isAuthenticatedMiddleware();
  }
}
module.exports = Router;