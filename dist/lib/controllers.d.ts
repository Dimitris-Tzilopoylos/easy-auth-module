export = Controllers;
declare class Controllers {
    static loginController(req: any, res: any): Promise<any>;
    static registerController(req: any, res: any): Promise<any>;
    static isAuthenticatedMiddleware(): (req: any, res: any, next: any) => Promise<any>;
    static getMeController(req: any, res: any): Promise<any>;
    static refreshTokenController(req: any, res: any): Promise<any>;
    static updatePasswordController(req: any, res: any): Promise<any>;
    static resendVerificationController(req: any, res: any): Promise<any>;
    static verifyAccountController(req: any, res: any): Promise<any>;
    static sendForgotPasswordRequestController(req: any, res: any): Promise<any>;
    static forgotPasswordController(req: any, res: any): Promise<any>;
}
