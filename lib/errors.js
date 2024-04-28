class ApiError extends Error {
  constructor(name, message, status) {
    super(message);
    this.stack = super.stack;
    this.status = status;
    this.name = name;
  }
}

class BadRequest extends ApiError {
  constructor(message) {
    super("ApiError", message || "Bad Request", 400);
  }
}

class InternalServer extends ApiError {
  constructor(message) {
    super("ApiError", message || "Internal Server Error", 500);
  }
}

class Forbidden extends ApiError {
  constructor(message) {
    super("ApiError", message || "Forbidden", 403);
  }
}

class Unauthorized extends ApiError {
  constructor(message) {
    super("ApiError", message || "Unauthorized", 401);
  }
}

module.exports = {
  Unauthorized,
  Forbidden,
  BadRequest,
  InternalServer,
  ApiError,
};
