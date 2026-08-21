# Paubox Node — Codebase Guide

## Project overview

`paubox-node` is the official Node.js SDK for the Paubox platform. It exposes two services:

- **emailService** — authenticated REST client for the Paubox Email API (`api.paubox.com/v1/`). Sends messages, tracks delivery, and manages dynamic Handlebars templates.
- **formService** — REST client for the Paubox Forms API (`api.paubox.com/forms`). Fetches form definitions and submits form responses without credentials, and also supports authenticated form-management endpoints (list/create/update/archive/copy forms, stats, submissions, CSV/PDF exports) via an optional scoped API key.

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
    formService.js       # Forms API methods (public + authenticated management)
lib/                     # Babel-compiled output of src/ — not edited by hand
test/                    # Mocha test suite (one file per public method)
index.js                 # Public exports: emailService, formService, message, templatedMessage
```

## Architecture

### emailService

- Constructor requires `apiKey` (or env var `API_KEY`). A legacy `apiUsername` in the config is accepted and ignored.
- All requests use `apiHelper`, which injects `Authorization: Token token=<apiKey>`.
- Base URL: `https://api.paubox.com/v1/`.
- Dynamic template uploads use `FormData` (multipart); all other requests are JSON.
- Response validation: methods inspect well-known fields and throw the raw response if unexpected.

### formService

- Base URL: `https://api.paubox.com/forms` (overridable via `config.baseURL` or `FORMS_BASE_URL`).
- Uses `axios.create` directly (no `apiHelper`).
- `getForm` and `submitForm` remain unauthenticated — public endpoints called by form respondents; they never send an Authorization header.
- `getForm` validates that the response contains an `id` field before returning.
- `submitForm` sends JSON and resolves to `null` on HTTP 201 (no response body).
- Supports file attachments up to 250 MB via base64-encoded content in the request body.
- Form-management methods (`listForms`, `getFormById`, `createForm`, `updateForm`, `archiveForm`, `unarchiveForm`, `copyForm`, `getFormStats`, `listSubmissions`, `exportSubmissionsCsv`, `exportSubmissionPdf`) require a scoped API key with the `forms` scope, passed as `{ apiKey }` to the constructor or via the `FORMS_API_KEY` env var, and sent as `Authorization: Bearer <apiKey>`. They throw if no key is configured.

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
5. Do **not** hand-edit `version` in `package.json` or add a `CHANGELOG.md` entry — release-please owns both. See [Releases](#releases).

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Merging to `master` refreshes a standing release PR; merging *that* PR bumps `package.json` and the lockfile, writes `CHANGELOG.md`, creates a bare `vX.Y.Z` tag and a GitHub release, and then **publishes to npm**.

The next version is derived from PR titles, so the title is the only thing that matters: `feat:` gives a minor bump, `fix:` a patch, and a `!` suffix or a `BREAKING CHANGE:` footer gives a major. `.github/workflows/pr-title.yml` rejects titles release-please cannot parse — an unparseable one would otherwise be dropped from the changelog silently.

`.release-please-manifest.json` tracks the last released version and is seeded from npm.

Publishing runs as a job inside `release-please.yml`, gated on `release_created`, and verifies the tag and `package.json` agree before uploading. Nothing is keyed on tag pushes, so a stray or malformed tag cannot cause a publish.

Authentication is npm **trusted publishing** (OIDC) — there is no token to rotate or expire. npm pins the trust to the exact `Paubox` / `paubox-node` / `release-please.yml` triple, so **renaming that workflow file breaks publishing** until the entry at <https://www.npmjs.com/package/paubox-node/access> is updated to match. Two related constraints: the job must run on Node 24 or newer, because trusted publishing needs npm >= 11.5.1 and Node 22 ships 10.9; and `repository.url` in `package.json` must keep pointing at this GitHub repo, because npm checks it.

If a publish fails, re-run the failed `publish` job from the Actions tab on that release-please run. The tag and GitHub release are already created by that point and `npm publish` is the last step, so nothing is lost and no version number is consumed. That re-run is the escape hatch — there is deliberately no separate manual publish workflow, since npm allows only one trusted publisher per package and a second workflow file could not authenticate.

To force a specific version, land an empty commit carrying a `Release-As` footer:

```bash
git commit --allow-empty -m "chore: release 2.0.0" -m "Release-As: 2.0.0"
```

## Code style

- CommonJS (`'use strict'` + `require`/`module.exports`).
- Async/await throughout service methods.
- ESLint + Prettier enforced; run `npm run build` to check before committing.
- No inline comments except where the behaviour is non-obvious.
