"use strict";

const { ApiError } = require("./errors");
class HttpAdapter {
  static adapterType = "fastify";
  static supportedAdapters = {
    fastify: "fastify",
    // koa: "koa",
    express: "express",
  };
  static adapter;
  static get(route, handler) {
    HttpAdapter.registerRoute("get", route, handler);
  }
  static post(route, handler) {
    HttpAdapter.registerRoute("post", route, handler);
  }
  static put(route, handler) {
    HttpAdapter.registerRoute("put", route, handler);
  }
  static patch(route, handler) {
    HttpAdapter.registerRoute("patch", route, handler);
  }
  static delete(route, handler) {
    HttpAdapter.registerRoute("delete", route, handler);
  }
  static setAdapther(type, adapter) {
    HttpAdapter.adapterType = type;
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.fastify:
        adapter.decorateRequest("authContext", null);
        break;
      case HttpAdapter.supportedAdapters.express:
      case HttpAdapter.supportedAdapters.ultimateExpress:
        //   case HttpAdapter.supportedAdapters.koa:
        break;
      default:
        throw new Error(`Unsupported http adapter ${HttpAdapter.adapterType}`);
    }
    HttpAdapter.adapter = adapter;
  }
  static registerRoute(method, route, handler) {
    const formattedMethod = method.toLowerCase();
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.fastify:
        HttpAdapter.adapter[formattedMethod](route, handler);
        break;
      case HttpAdapter.supportedAdapters.express:
      case HttpAdapter.supportedAdapters.ultimateExpress:
        HttpAdapter.adapter[formattedMethod](route, handler);
        break;
      case HttpAdapter.supportedAdapters.koa:
        HttpAdapter.adapter[formattedMethod](route, handler);
        break;
      default:
        throw new Error(`Unsupported http adapter ${HttpAdapter.adapterType}`);
    }
  }
  static makeJsonResponse({ res, status, data, error } = {}) {
    if (error) {
      if (error instanceof ApiError) {
        data = {
          message: error.message,
        };
        status = error.status;
      } else {
        status = 500;
        data = {
          message: error?.message || "Internal Server Error",
        };
      }
    }
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.fastify:
        return res.code(status || 200).send(data);
      case HttpAdapter.supportedAdapters.express:
      case HttpAdapter.supportedAdapters.ultimateExpress:
        return res.status(status || 200).json(data);
      //   case HttpAdapter.supportedAdapters.koa:
      //     res.status = status || 200;
      //     res.body = data || error;
      //     return res;
      default:
        throw new Error(`Unsupported http adapter ${HttpAdapter.adapterType}`);
    }
  }
  static getParams(req) {
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.fastify:
        return req.params;
      case HttpAdapter.supportedAdapters.express:
      case HttpAdapter.supportedAdapters.ultimateExpress:
        return req.params;
      case HttpAdapter.supportedAdapters.koa:
        return req.request.params;
      default:
        throw new Error(`Unsupported http adapter ${HttpAdapter.adapterType}`);
    }
  }
  static getQueryParams(req) {
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.fastify:
        return req.query;
      case HttpAdapter.supportedAdapters.express:
      case HttpAdapter.supportedAdapters.ultimateExpress:
        return req.query;
      case HttpAdapter.supportedAdapters.koa:
        return req.request.query;
      default:
        throw new Error(`Unsupported http adapter ${HttpAdapter.adapterType}`);
    }
  }
  static getBody(req) {
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.fastify:
        return req.body;
      case HttpAdapter.supportedAdapters.express:
      case HttpAdapter.supportedAdapters.ultimateExpress:
        return req.body;
      case HttpAdapter.supportedAdapters.koa:
        return req.request.body;
      default:
        throw new Error(`Unsupported http adapter ${HttpAdapter.adapterType}`);
    }
  }
  static getHeaders(req) {
    switch (HttpAdapter.adapterType) {
      case HttpAdapter.supportedAdapters.fastify:
        return req.headers;
      case HttpAdapter.supportedAdapters.express:
      case HttpAdapter.supportedAdapters.ultimateExpress:
        return req.headers;
      case HttpAdapter.supportedAdapters.koa:
        return req.request.headers;
      default:
        throw new Error(`Unsupported http adapter ${HttpAdapter.adapterType}`);
    }
  }
}
module.exports = HttpAdapter;
