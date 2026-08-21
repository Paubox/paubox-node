# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

Not yet published to npm.

### 🚀 New Features

- Add `formService` for the Paubox Forms API, exported from the package root as `formService(config)` and configurable via `FORMS_API_KEY` / `FORMS_BASE_URL`
  - Public endpoints, no credential attached: `getForm(formId)`, `submitForm(formId, formData, attachments)`
  - Form management with a scoped API key (`forms` scope, sent as `Authorization: Bearer <key>`): `listForms`, `getFormById`, `createForm`, `updateForm`, `archiveForm`, `unarchiveForm`, `copyForm`, `getFormStats`
  - Submissions: `listSubmissions`, `exportSubmissionsCsv`, `exportSubmissionPdf`
- `emailService` no longer requires `apiUsername` — an API key alone authenticates. A legacy `apiUsername` in the config is accepted and ignored, so existing code keeps working

### ⚠️ Behavior Changes

- The Email API host moves from `api.paubox.net` to `api.paubox.com`, and the base URL drops the per-customer username path segment
- The Forms API default base URL moves from `apx.paubox.com/forms` to `api.paubox.com/forms`; the `baseURL` config option and `FORMS_BASE_URL` are unchanged as overrides

### 🔒 Hardening

- Validate and encode every caller-supplied value interpolated into a Forms request path. Authenticated endpoints require a UUID; the public `getForm` and `submitForm` encode the segment instead of rejecting it, so any id they accepted before still works

### 📚 Documentation

- Link Paubox Community discussions
- Update `docs.paubox.com` links to current Mintlify URLs and fix broken `paubox.com` marketing links

## v1.4.2 / 2025-10-10

### 🎉 Enhancements

- Add an automated npm publish workflow triggered on `v*.*.*` tags
- Bump axios from 1.9.0 to 1.12.0 ([#47](https://github.com/Paubox/paubox-node/pull/47))

## v1.4.1 / 2025-08-01

Supersedes 1.4.0, which was bumped in `package.json` about an hour earlier the
same day but was never published to npm and never tagged. 1.4.1 is the release
that actually shipped this work.

### ⚠️ Behavior Changes

- Error handling changed substantially: non-200 responses now bubble up as exceptions from axios instead of being swallowed and returned as `response.data`

### 🎉 Enhancements

- Replace strict type checks that failed under minification with duck typing
- Loosen the `engines` specifier
- Bump form-data from 4.0.3 to 4.0.4 ([#44](https://github.com/Paubox/paubox-node/pull/44))

## v1.3.1 / 2025-07-02

### 🚀 New Features

- Add support for custom headers on outbound messages ([#43](https://github.com/Paubox/paubox-node/pull/43))

### 🎉 Enhancements

- Add tests for `sendMessage`, `sendBulkMessages`, and `sendTemplatedMessage`

## v1.3.0 / 2025-06-24

### 🚀 New Features

- Add dynamic template management to `emailService`: `listDynamicTemplates`, `getDynamicTemplate`, `createDynamicTemplate`, `updateDynamicTemplate`, `deleteDynamicTemplate` ([#37](https://github.com/Paubox/paubox-node/pull/37), [#39](https://github.com/Paubox/paubox-node/pull/39))
- Add `sendTemplatedMessage` and a `templatedMessage` data class ([#40](https://github.com/Paubox/paubox-node/pull/40))
- Add `sendBulkMessages` for sending several messages in one call ([#36](https://github.com/Paubox/paubox-node/pull/36))
- Add message validation with clearer errors for malformed input

### 🐛 Fixes

- Fix incorrectly stringified HTTP POST bodies ([#41](https://github.com/Paubox/paubox-node/pull/41))

### 🎉 Enhancements

- Convert all service methods to `async`
- Add a Babel build step (`src/` compiled to `lib/`), ESLint, and Prettier
- Add a GitHub Actions workflow running the test suite
- Bump axios to 1.9.0 ([#38](https://github.com/Paubox/paubox-node/pull/38)) and upgrade mocha ([#42](https://github.com/Paubox/paubox-node/pull/42))

## v1.2.5 / 2021-04-28

### 🐛 Fixes

- [#24](https://github.com/Paubox/paubox-node/pull/24) Removing security dependencies. Implementing a Changelog. (@niwong)
