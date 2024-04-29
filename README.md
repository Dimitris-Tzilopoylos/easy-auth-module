# easy-auth-module

**easy-auth-module** is a flexible and easy-to-use authentication module for Node.js applications, designed to handle user authentication, authorization, and related tasks with minimal setup.

**Note: This package is primarily intended for personal usage. Feel free to try it out, but be aware that it might not be suitable for all production scenarios.**

## Installation

Install the package via npm:

```bash
npm install easy-auth-module
```

## Usage

### Basic Setup with Fastify

```javascript
import fastify from "fastify";
import Authenticator from "easy-auth-module";
import db from "./db";
import path from "path";

const app = fastify({ logger: true });

const authModule = new Authenticator({
  prefix: "/api/v1/auth",
  http: { type: "fastify", adapter: app },
  auth: {
    identityField: "email",
    credentialsField: "password",
    findUserByIdentifier: (identifier) => db.findOne({ email: identifier }),
    createUser: (data) => db.create(data),
    updateUserPassword: (identifier, password) =>
      db.update({ set: { password }, where: { email: identifier } }),
    verifyUser: (identifier) =>
      db.update({ set: { verified: true }, where: { email: identifier } }),
    refreshTokenConfig: {
      secret: "refreshtokensecret",
      expirationInSeconds: 60 * 60,
      property: "refreshToken",
    },
    accessTokenConfig: {
      secret: "accesstokensecret",
      expirationInSeconds: 5 * 60,
      property: "accessToken",
    },
  },
  mailOptions: {
    host: "mail.example.com",
    port: 25,
    auth: {
      user: "example@example.com",
      pass: "mysupersecretpassword",
    },
    tls: {
      rejectUnauthorized: false,
    },
    secure: false,
    verification: {
      disabled: false,
      ttl: 60 * 60 * 24,
      template: path.join(__dirname, "templates", "verify.ejs"),
      from: "example@example.com",
      subject: "Verify your account",
      baseUrl: "https://www.my-ui-app.com/verify-my-account",
    },
    forgotPassword: {
      disabled: false,
      ttl: 60 * 60 * 24,
      template: path.join(__dirname, "templates", "forgot-password.ejs"),
      from: "example@example.com",
      subject: "Reset your password",
      baseUrl: "https://www.my-ui-app.com/reset-password",
    },
  },
});

app.get(
  "/protected",
  { preHandler: authModule.isAuthenticated() },
  async (req: any, res: any) => {
    return { message: `Hi ${req.authContext.email}` };
  }
);

app.listen({ host: "localhost", port: 8000 });
```

### Basic Setup with Express

```javascript
import express from "express";
import Authenticator from "easy-auth-module";
import db from "./db";
import path from "path";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const authModule = new Authenticator({
  prefix: "/api/v1/auth",
  http: { type: "express", adapter: app },
  auth: {
    identityField: "email",
    credentialsField: "password",
    findUserByIdentifier: (identifier) => db.findOne({ email: identifier }),
    createUser: (data) => db.create(data),
    updateUserPassword: (identifier, password) =>
      db.update({ set: { password }, where: { email: identifier } }),
    verifyUser: (identifier) =>
      db.update({ set: { verified: true }, where: { email: identifier } }),
    refreshTokenConfig: {
      secret: "refreshtokensecret",
      expirationInSeconds: 60 * 60,
      property: "refreshToken",
    },
    accessTokenConfig: {
      secret: "accesstokensecret",
      expirationInSeconds: 5 * 60,
      property: "accessToken",
    },
  },
});

app.get("/protected", authModule.isAuthenticated(), async (req, res) => {
  return res.json({ message: `Hi ${req.authContext.email}` });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
```

The `/protected` route is protected by the `isAuthenticated` middleware provided by `authModule`. If the user is not authenticated, it respondes with an unauthorized error. You can access the authenticated user's data by req.authContext anywhere you use `authModule.isAuthenticated()` middleware.

### Features

- **Flexible Configuration**: Customize authentication settings to fit your application's requirements.
- **Integration with Fastify/Express**: Seamlessly integrate with Fastify or Express for efficient handling of authentication routes and middleware.
- **Token Management**: Generate access and refresh tokens with configurable expiration times and properties.
- **Email Verification**: Enable email verification for new user accounts, with customizable email templates and verification URLs.
- **Password Reset**: Implement password reset functionality with customizable email templates and reset URLs.

## API

### `Authenticator`

- `Authenticator(options)`: Constructor function to create a new instance of the Authenticator.

##### Options

- `prefix`: The base URL prefix for authentication routes.
- `http`: Configuration for HTTP server integration (supports Fastify).
- `auth`: Configuration options for authentication behavior.
- `mailOptions`: Configuration options for email communication, including verification and password reset emails.

---

### Custom Email Templates (Recommended)

For the `forgotPassword` and `verification` features, you can customize the email templates (providing their path in the config) to include user data along with a property `forgotPassword` or `verification`, which is an object containing the URL with the token. Ensure that your email template is .ejs.

```javascript
// Example of template data for forgotPassword feature:
{
  "email": "user@example.com",
  "name": "John Doe",
  "forgotPassword": {
    "url": "https://www.my-ui-app.com/reset-password?token=resetToken123"
  }
}

// Example of template data for verification feature:
{
  "email": "user@example.com",
  "name": "John Doe",
  "verification": {
    "url": "https://www.my-ui-app.com/verify-account?token=verificationToken123"
  }
}
```

---

## Authentication Endpoints

### `GET {prefix}`

Get the authenticated user

#### Headers

`Authorization` (string, required): Bearer token containing the access token.

### `POST {prefix}/register`

Registers a new user with the provided credentials.

#### Request Body

- `email` (string, required): The email address of the user (it has to match the identifyField in config).
- `password` (string, required): The password for the user account (it has to match the credentialsField in config).
- `...`: anything else that you can handle in the createUser callback

### `POST {prefix}/login`

Logs in a user with the provided credentials and returns access and refresh tokens.

#### Request Body

- `email` (string, required): The email address of the user (it should match the identifyField in config).
- `password` (string, required): The password for the user account (it should match the credentialsField in config).

### `POST {prefix}/refresh-token`

Refreshes the access token using the provided refresh token.

#### Request Body

- `refreshToken` (string, required): it should match the property field inside refrshTokenConfig.

### `GET {prefix}/verify/:token`

Verifies the user's account using the verification token.

#### Path Parameters

- `token` (string, required): The verification token sent to the user's email address.

### `POST {prefix}/verify`

Retry sending a verification email. This operation will fail if there is already an active token that didn't expired (`ttl` field in `mailOptions.verification`)

#### Request Body

- `email` (string, required)

### `POST {prefix}/forgot-password`

Initiates the password reset process by sending a reset link to the user's email address.

#### Request Body

- `email` (string, required): The email address of the user.

### `POST {prefix}/forgot-password/:token`

Resets the user's password using the reset token and the new password.

#### Path Parameters

- `token` (string, required): The reset token sent to the user's email address.

#### Request Body

- `password` (string, required): The new password for the user account.
- `verifyPassword` (string, required): has to match the `password` field.

### `POST {prefix}/change-password`

Resets an authenticated user's password.

### Headers

`Authorization` (string, required): Bearer token containing the access token.

#### Request Body

- `oldPassword` (string, required): The user's old password.
- `password` (string, required): The new password for the user account.
- `verifyPassword` (string, required): has to match the `password` field.

```

```
