export class Unauthorized extends ApiError {
    constructor(message: any);
}
export class Forbidden extends ApiError {
    constructor(message: any);
}
export class BadRequest extends ApiError {
    constructor(message: any);
}
export class InternalServer extends ApiError {
    constructor(message: any);
}
export class ApiError extends Error {
    constructor(name: any, message: any, status: any);
    stack: string;
    status: any;
    name: any;
}
