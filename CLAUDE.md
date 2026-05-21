# Paubox Node — Codebase Guide

## Project overview

`paubox-node` is the official Node.js SDK for the Paubox platform. It exposes two services:

- **emailService** — authenticated REST client for the Paubox Email API (`api.paubox.net/v1/`). Sends messages, tracks delivery, and manages dynamic Handlebars templates.
- **formService** — unauthenticated REST client for the Paubox Forms API (`next.paubox.com`). Fetches form definitions and submits form responses.

## Repository layout

```
src/
  data/
    baseMessage.js       # Shared utilities (safeBase64Encode, parseBool)
    message.js           # Email message class — validates & serialises to JSON
    templatedMessage.js  # Templated email class (extends base message)
  service/
    apiHelper.js         # Axios wrapper with Authorization header injection
    emailService.js      # Email + template API methods
    formService.js       # Forms API methods (no auth)
lib/                     # Babel-compiled output of src/ — not edited by hand
test/                    # Mocha test suite (one file per public method)
index.js                 # Public exports: emailService, formService, message, templatedMessage
```

## Architecture

### emailService

- Constructor requires `apiUsername` and `apiKey` (or env vars `API_USERNAME` / `API_KEY`).
- All requests use `apiHelper`, which injects `Authorization: Token token=<apiKey>`.
- Base URL: `https://api.paubox.net/v1/<apiUsername>/`.
- Dynamic template uploads use `FormData` (multipart); all other requests are JSON.
- Response validation: methods inspect well-known fields and throw the raw response if unexpected.

### formService

- No credentials required — these are public endpoints called by form respondents.
- Base URL: `https://next.paubox.com`.
- Uses `axios.create` directly (no `apiHelper`) since there is no auth header.
- `getForm` validates that the response contains an `id` field before returning.
- `submitForm` sends JSON and resolves to `null` on HTTP 201 (no response body).
- Supports file attachments up to 250 MB via base64-encoded content in the request body.

### Data models

- `message` / `templatedMessage` are value objects. Construction validates required fields and `toJSON()` serialises to the shape the API expects.
- `baseMessage` provides shared helpers used by both classes.

## Development commands

```bash
npm test             # Run full Mocha test suite
npm run test:watch   # Re-run tests on file changes
npm run lint         # ESLint
npm run format       # Prettier (writes in place)
npm run build        # lint → format → clean lib/ → Babel compile → prettier lib/
```

> **Build note:** the lint step checks that all `require()` targets in `index.js` exist in `lib/`. If you add a new service file, run `npm run build:babel` once to seed `lib/` before running the full `npm run build`.

## Testing patterns

- Framework: Mocha + Chai (`chai-as-promised`) + Sinon.
- All HTTP calls are stubbed via `sinon.stub(axios, 'create')`.
- Tests import directly from `src/` (not from `lib/`), so no build step is needed to run them.
- Each public method has its own test file under `test/`.
- Test files cover: happy path, input validation errors, API error responses, and unexpected response shapes.

## Adding a new endpoint

1. Add the method to the relevant service in `src/service/`.
2. Add a test file to `test/`.
3. If it is a new service, export it from `index.js` and run `npm run build:babel` before `npm run build`.
4. Document the method in `api.md` and add a usage example to `README.md`.

## Code style

- CommonJS (`'use strict'` + `require`/`module.exports`).
- Async/await throughout service methods.
- ESLint + Prettier enforced; run `npm run build` to check before committing.
- No inline comments except where the behaviour is non-obvious.
