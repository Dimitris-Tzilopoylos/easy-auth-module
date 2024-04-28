"use strict";

const AuthService = require("./auth");
const {
  Unauthorized,
  InternalServer,
  Forbidden,
  BadRequest
} = require("./errors");
const HttpAdapter = require("./http-adapter");
class Controllers {
  static async loginController(req, res) {
    try {
      const data = await AuthService.login(req.body);
      return HttpAdapter.makeJsonResponse({
        data,
        res
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error
      });
    }
  }
  static async registerController(req, res) {
    try {
      const data = await AuthService.register(req.body);
      return HttpAdapter.makeJsonResponse({
        data,
        res
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error: new InternalServer()
      });
    }
  }
  static isAuthenticatedMiddleware() {
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.express:
        return async (req, res, next) => {
          try {
            const user = await AuthService.isAuthenticated(req);
            if (!req.authContext) {
              req.authContext = {
                user: null
              };
            }
            req.authContext.user = user;
            next();
          } catch (error) {
            return HttpAdapter.makeJsonResponse({
              res,
              error: new Unauthorized()
            });
          }
        };
      case HttpAdapter.supportedAdapters.fastify:
        return async (req, res) => {
          try {
            const user = await AuthService.isAuthenticated(req);
            if (!req.authContext) {
              req.authContext = {
                user: null
              };
            }
            req.authContext.user = user;
          } catch (error) {
            return HttpAdapter.makeJsonResponse({
              res,
              error: new Unauthorized()
            });
          }
        };
      default:
        throw new Error("Middleware generator failed due to: Unsupported adapter type");
    }
  }
  static async getMeController(req, res) {
    try {
      const data = await AuthService.isAuthenticated(req);
      return HttpAdapter.makeJsonResponse({
        data: AuthService.toSanitizedUser(data),
        res
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error: new Forbidden()
      });
    }
  }
  static async refreshTokenController(req, res) {
    try {
      const data = await AuthService.refreshToken(req.body);
      return HttpAdapter.makeJsonResponse({
        data: AuthService.toSanitizedUser(data),
        res
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error: new BadRequest()
      });
    }
  }
  static async updatePasswordController(req, res) {
    try {
      const data = await AuthService.updatePassword(req);
      return HttpAdapter.makeJsonResponse({
        data,
        res
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error
      });
    }
  }
  static async resendVerificationController(req, res) {
    try {
      await AuthService.resendVerification(req.body);
      return HttpAdapter.makeJsonResponse({
        res,
        data: {
          message: "ok"
        }
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error
      });
    }
  }
  static async verifyAccountController(req, res) {
    try {
      await AuthService.verifyAccount(req);
      return HttpAdapter.makeJsonResponse({
        res,
        data: {
          message: "ok"
        }
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error
      });
    }
  }
  static async sendForgotPasswordRequestController(req, res) {
    try {
      await AuthService.sendForgotPasswordRequest(req.body);
      return HttpAdapter.makeJsonResponse({
        res,
        data: {
          message: "ok"
        }
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error
      });
    }
  }
  static async forgotPasswordController(req, res) {
    try {
      await AuthService.forgotPassword(req);
      return HttpAdapter.makeJsonResponse({
        res,
        data: {
          message: "ok"
        }
      });
    } catch (error) {
      return HttpAdapter.makeJsonResponse({
        res,
        error: new BadRequest()
      });
    }
  }
}
module.exports = Controllers;