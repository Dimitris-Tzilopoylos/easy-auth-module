export = Mail;
declare class Mail {
    static transporter: any;
    constructor(mailConfig?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        tls: {
            rejectUnauthorized: boolean;
        };
    });
    isConfigured: boolean;
    transporterOptions: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        tls: {
            rejectUnauthorized: boolean;
        };
    };
    sendMail({ from, to, subject, html, text, attachments }: {
        from: any;
        to: any;
        subject: any;
        html: any;
        text: any;
        attachments: any;
    }): Promise<any>;
    sendHtmlMail({ from, to, subject, html, attachments }: {
        from: any;
        to: any;
        subject: any;
        html: any;
        attachments: any;
    }): Promise<any>;
    sendHtmlMailByPath({ from, to, subject, filename, attachments, templateData, }: {
        from: any;
        to: any;
        subject: any;
        filename: any;
        attachments: any;
        templateData: any;
    }): Promise<any>;
    sendTextMail({ from, to, subject, text, attachments }: {
        from: any;
        to: any;
        subject: any;
        text: any;
        attachments: any;
    }): Promise<any>;
    validateConfig(): boolean;
}
