export = HttpAdapter;
declare class HttpAdapter {
    static adapterType: string;
    static supportedAdapters: {
        fastify: string;
        express: string;
    };
    static adapter: any;
    static get(route: any, handler: any): void;
    static post(route: any, handler: any): void;
    static put(route: any, handler: any): void;
    static patch(route: any, handler: any): void;
    static delete(route: any, handler: any): void;
    static setAdapther(type: any, adapter: any): void;
    static registerRoute(method: any, route: any, handler: any): void;
    static makeJsonResponse({ res, status, data, error }?: {
        res: any;
        status: any;
        data: any;
        error: any;
    }): any;
    static getParams(req: any): any;
    static getQueryParams(req: any): any;
    static getBody(req: any): any;
    static getHeaders(req: any): any;
}
