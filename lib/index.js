const AuthService = require("./auth");
const Router = require("./router");
const MemoryStorage = require("./storage");

class Authenticator {
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
    } = {},
    storage = MemoryStorage,
  } = {}) {
    this.router = Router;
    this.authService = AuthService;
    this.config = {
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
    };
    return Router.init(this.config);
  }

  isAuthenticated() {
    return Router.isAuthenticated();
  }
}

module.exports = Authenticator;
