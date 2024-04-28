const nodemailer = require("nodemailer");
const ejs = require("ejs");
const ValidationService = require("easy-validation-service");

class Mail {
  static transporter;

  constructor(
    mailConfig = {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "your_username",
        pass: "your_password",
      },
      tls: {
        rejectUnauthorized: false,
      },
    }
  ) {
    this.isConfigured = false;
    this.transporterOptions = mailConfig;
    this.validateConfig();
  }
  async sendMail({ from, to, subject, html, text, attachments }) {
    try {
      if (!this.isConfigured) {
        throw new Error("Mail client is not configured");
      }
      if (!Mail.transporter) {
        Mail.transporter = nodemailer.createTransport(this.transporterOptions);
      }

      return Mail.transporter.sendMail({
        subject,
        ...(!html && { text }),
        ...(!text && { html }),
        from,
        to,
        attachments,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendHtmlMail({ from, to, subject, html, attachments }) {
    try {
      return this.sendMail({ from, to, subject, html, attachments });
    } catch (error) {
      console.log(error);
    }
  }

  async sendHtmlMailByPath({
    from,
    to,
    subject,
    filename,
    attachments,
    templateData,
  }) {
    try {
      const html = await ejs.renderFile(filename, templateData);
      return this.sendMail({ from, to, subject, html, attachments });
    } catch (error) {
      console.log(error);
    }
  }

  async sendTextMail({ from, to, subject, text, attachments }) {
    try {
      return this.sendMail({ from, to, subject, text, attachments });
    } catch (error) {
      console.log(error);
    }
  }

  validateConfig() {
    if (ValidationService.isNullOrUndefinedOrEmpty(this.transporterOptions)) {
      this.isConfigured = false;
      return true;
    }
    if (ValidationService.isObject(this.transporterOptions)) {
      if (
        !Object.keys(this.transporterOptions).length ||
        Object.values(this.transporterOptions).every((value) =>
          ValidationService.isNullOrUndefinedOrEmpty(value)
        )
      ) {
        this.isConfigured = false;
        return true;
      }
      if (
        !ValidationService.validateBody(this.transporterOptions, {
          host: (value) =>
            ValidationService.validateString({
              value,
              min: 4,
              noWhiteSpace: true,
            }),
          port: (value) => !isNaN(value) && parseInt(value) > 0,
          secure: (value) => ValidationService.isBoolean(value),
          auth: (value) =>
            ValidationService.isNullOrUndefinedOrEmpty(value) ||
            (ValidationService.isObject(value) &&
              ValidationService.validateString({ value: value.user, min: 1 }) &&
              ValidationService.validateString({
                value: value.pass,
                min: 1,
                noWhiteSpace: true,
              })),
        })
      ) {
        throw new Error(`mail options are invalid`);
      }

      this.isConfigured = true;
    }

    return this.isConfigured;
  }
}

module.exports = Mail;
