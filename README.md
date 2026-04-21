# Year of Prayer: Proxy Service

An Express Router package that proxies requests to the Year of Prayer API. Extracted as a shared module for use across multiple Node.js/Express applications.

## Installation

This package is published to **GitHub Packages**. Authentication is required even though the package is public.

### 1. Create a GitHub Personal Access Token (PAT)

Go to **GitHub → Settings → Developer settings → Personal access tokens** and generate a token with the `read:packages` scope.

### 2. Configure npm authentication

Add a `.npmrc` file to the **root of your project** (not `~/.npmrc`):

```
@missionaldigerati:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Set `GITHUB_TOKEN` in your shell or CI environment — do **not** hardcode the token in the file.

### 3. Install

```bash
npm install @missionaldigerati/yop-express-proxy-routes
```

> **Note:** `express` is a peer dependency and must be installed separately in your application.

## Usage

```js
import express from 'express';
import { createPrayingRouter } from '@missionaldigerati/yop-express-proxy-routes';

const app = express();
app.use(express.json());

const prayingRouter = createPrayingRouter({
  apiUrl: process.env.API_URL,
  clientId: process.env.CLIENT_ID,
  encryptionKey: process.env.ENCRYPTION_KEY, // must be exactly 32 characters — shorter values will throw at runtime
  // platform: 'my app name',               // optional, defaults to 'year of prayer proxy'
});

app.use('/api/praying', prayingRouter);
```

The router registers its routes relative to the mount path your application provides.

## Routes

### `POST /register`

Registers a new consumer with the upstream API and returns an encrypted API key for future requests.

All request body fields are optional. When omitted, `device_model`, `device_platform`, and `device_version` default to the `platform` value configured on the router; all other fields fall back to the values shown below.

**Request body** *(all fields optional)*
```json
{
  "device_model": "year of prayer proxy",
  "device_platform": "year of prayer proxy",
  "device_version": "year of prayer proxy",
  "device_uuid": "",
  "push_token": "",
  "push_at": "10:00:00",
  "push_lang": "eng",
  "time_zone": "UTC",
  "receive_push": 0
}
```

**Response**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "iv": "<hex string>",
    "encryptedData": "<hex string>"
  }
}
```

---

### `POST /praying`

Records a prayer for the given day.

**Request body**
```json
{
  "apiKey": {
    "iv": "<hex string>",
    "encryptedData": "<hex string>"
  },
  "month": 4,
  "day": 20
}
```

**Response**
```json
{
  "success": true,
  "message": "Success",
  "data": null
}
```

---

### `POST /total`

Retrieves the total prayer count for the given day. If `apiKey` is omitted the request is authenticated using the configured `clientId`.

**Request body**
```json
{
  "month": 4,
  "day": 20,
  "apiKey": {
    "iv": "<hex string>",
    "encryptedData": "<hex string>"
  }
}
```

**Response**
```json
{
  "success": true,
  "message": "Success",
  "data": { }
}
```

## Contributing / Development setup

This package is published to **GitHub Packages**, which requires authentication even for installation.

### 1. Create a GitHub Personal Access Token (PAT)

Go to **GitHub → Settings → Developer settings → Personal access tokens** and generate a token with:
- `read:packages` — to install the package in a consuming app
- `write:packages` — to publish new versions of this package

### 2. Configure npm authentication

Add the following to a `.npmrc` file at the **root of your project** (not `~/.npmrc`), so the `@missionaldigerati` scope is always resolved from GitHub Packages:

```
@missionaldigerati:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then set the `GITHUB_TOKEN` environment variable in your shell or CI secrets — do **not** hardcode the token in the file.

### 3. Install dependencies

```bash
npm install
```

### Node.js version

This package requires **Node.js 14 or later** (declared in `engines`). Use [nvm](https://github.com/nvm-sh/nvm) and run `nvm use` to switch automatically.

---

## Linting

This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/).

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

Linting runs automatically on every push and pull request via the included GitHub Actions workflow (`.github/workflows/lint.yml`).

## License

This code is licensed under the GPL-3.0 License. See the COPYING file for more details.
