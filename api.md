# Paubox Node API Reference

This document describes all public methods exposed by `paubox-node`.

---

## emailService

Create a service instance to send email and manage dynamic templates.

```javascript
const pbMail = require('paubox-node');
const service = pbMail.emailService({ apiKey: '...' });
```

The API key can also be loaded from the environment variable `API_KEY`.

---

### sendMessage(message)

Send a single email message.

| Parameter | Type      | Description                       |
| --------- | --------- | --------------------------------- |
| `message` | `Message` | A `Message` instance (see below). |

**Returns:** `Promise<object>` — the Paubox API response.

**Docs:** https://docs.paubox.com/email-api/messages

---

### sendBulkMessages(messages)

Send multiple email messages in a single request.

| Parameter  | Type        | Description                   |
| ---------- | ----------- | ----------------------------- |
| `messages` | `Message[]` | Array of `Message` instances. |

> Recommended batch size: 50 or fewer. Source tracking IDs are returned in the same order as the input array.

**Returns:** `Promise<object>` — the Paubox API response.

**Docs:** https://docs.paubox.com/email-api/bulk-messages

---

### sendTemplatedMessage(message)

Send an email using a dynamic template.

| Parameter | Type               | Description                                |
| --------- | ------------------ | ------------------------------------------ |
| `message` | `TemplatedMessage` | A `TemplatedMessage` instance (see below). |

**Returns:** `Promise<object>` — the Paubox API response.

**Docs:** https://docs.paubox.com/email-api/templated-messages

---

### getEmailDisposition(sourceTrackingId)

Get the delivery and open status of a previously sent message.

| Parameter          | Type     | Description                                             |
| ------------------ | -------- | ------------------------------------------------------- |
| `sourceTrackingId` | `string` | The ID returned by `sendMessage` or `sendBulkMessages`. |

**Returns:** `Promise<object>` — the message receipt object. If `openedStatus` is not set, it defaults to `"unopened"`.

**Docs:** https://docs.paubox.com/email-api/message-receipt

---

### createDynamicTemplate(templateName, templateContent)

Create a new dynamic (Handlebars) template.

| Parameter         | Type                         | Description                      |
| ----------------- | ---------------------------- | -------------------------------- |
| `templateName`    | `string`                     | Name for the template.           |
| `templateContent` | `string \| Buffer \| Stream` | Template body (Handlebars HTML). |

**Returns:** `Promise<object>` — the Paubox API response.

**Docs:** https://docs.paubox.com/email-api/dynamic-templates/create

---

### updateDynamicTemplate(templateId, templateName, templateContent)

Update an existing dynamic template. At least one of `templateName` or `templateContent` must be provided.

| Parameter         | Type                                 | Description                                       |
| ----------------- | ------------------------------------ | ------------------------------------------------- |
| `templateId`      | `number`                             | ID of the template (from `listDynamicTemplates`). |
| `templateName`    | `string \| null`                     | New name, or `null` to leave unchanged.           |
| `templateContent` | `string \| Buffer \| Stream \| null` | New body, or `null` to leave unchanged.           |

**Returns:** `Promise<object>` — the Paubox API response.

**Docs:** https://docs.paubox.com/email-api/dynamic-templates/update

---

### deleteDynamicTemplate(templateId)

Delete a dynamic template.

| Parameter    | Type     | Description                                       |
| ------------ | -------- | ------------------------------------------------- |
| `templateId` | `number` | ID of the template (from `listDynamicTemplates`). |

**Returns:** `Promise<object>` — the Paubox API response.

**Docs:** https://docs.paubox.com/email-api/dynamic-templates/delete

---

### getDynamicTemplate(templateId)

Get a single dynamic template by ID.

| Parameter    | Type     | Description                                       |
| ------------ | -------- | ------------------------------------------------- |
| `templateId` | `number` | ID of the template (from `listDynamicTemplates`). |

**Returns:** `Promise<object>` — the template object (`id`, `name`, `api_customer_id`, `body`, `created_at`, `updated_at`, `metadata`).

**Docs:** https://docs.paubox.com/email-api/dynamic-templates/get

---

### listDynamicTemplates()

List all dynamic templates for the account.

**Returns:** `Promise<object[]>` — array of template summary objects.

**Docs:** https://docs.paubox.com/email-api/dynamic-templates

---

## formService

Create a service instance for Paubox Forms.

The public methods (`getForm`, `submitForm`) require **no API credentials**:

```javascript
const pbMail = require('paubox-node');
const service = pbMail.formService();
```

The form-management methods require a **scoped API key with the `forms` scope**, passed as `{ apiKey }` to `pbMail.formService()` or via the `FORMS_API_KEY` environment variable:

```javascript
const pbMail = require('paubox-node');
const service = pbMail.formService({ apiKey: 'your-scoped-api-key' });
```

Calling an authenticated method without an API key throws an error.

Base URL: `https://api.paubox.com/forms`

---

### getForm(formId)

Get the full form definition for a given form UUID. Used by form embeds before rendering.

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `formId`  | `string` | UUID of the form to retrieve. |

**Returns:** `Promise<object>` — the form object:

| Field                          | Type      | Description                                  |
| ------------------------------ | --------- | -------------------------------------------- |
| `id`                           | `string`  | Form UUID.                                   |
| `title`                        | `string`  | Form title.                                  |
| `description`                  | `string?` | Optional description.                        |
| `form_html`                    | `string?` | Renderable HTML for the form.                |
| `form_json`                    | `object?` | JSON schema describing form fields.          |
| `form_css`                     | `string?` | CSS styles for the form.                     |
| `vanity_url`                   | `string?` | Custom URL slug.                             |
| `version`                      | `number`  | Form version number.                         |
| `active`                       | `boolean` | Whether the form accepts submissions.        |
| `customer_id`                  | `number`  | Owning customer ID.                          |
| `signable`                     | `boolean` | Whether the form includes a signature field. |
| `signature_confirmation_label` | `string?` | Label for signature confirmation.            |
| `submission_count`             | `number`  | Total submissions received.                  |
| `type`                         | `string?` | Form type classification.                    |
| `deleted`                      | `boolean` | Whether the form has been deleted.           |
| `archived`                     | `boolean` | Whether the form has been archived.          |
| `created_at`                   | `string`  | ISO 8601 creation timestamp.                 |
| `updated_at`                   | `string`  | ISO 8601 last-updated timestamp.             |

**Throws:** Rejects with the API error if the form is not found (HTTP 404).

**Docs:** https://docs.paubox.com/forms/get-form

---

### submitForm(formId, formData, attachments)

Submit a respondent's answers for a form. Maximum request size is 250 MB.

| Parameter     | Type        | Description                                                     |
| ------------- | ----------- | --------------------------------------------------------------- |
| `formId`      | `string`    | UUID of the form being submitted.                               |
| `formData`    | `object`    | Key-value pairs matching the form's field schema (`form_json`). |
| `attachments` | `object[]?` | Optional array of file attachments (see below).                 |

Each attachment object:

| Field     | Type     | Description                      |
| --------- | -------- | -------------------------------- |
| `name`    | `string` | Filename (e.g. `"consent.pdf"`). |
| `content` | `string` | Base64-encoded file content.     |

**Returns:** `Promise<null>` — resolves to `null` on success (HTTP 201 No Content).

**Throws:** Rejects with the API error on HTTP 400 (missing `form_data`) or 404 (form not found).

**Docs:** https://docs.paubox.com/forms/submit-form

---

### listForms(params)

List the customer's forms with filtering, ordering, and pagination. Requires a scoped API key with the `forms` scope.

| Parameter | Type     | Description                                                           |
| --------- | -------- | --------------------------------------------------------------------- |
| `params`  | `object` | Query parameters. `customer_id` is required; other keys are optional. |

Supported `params` keys:

| Key           | Type      | Description                                                                        |
| ------------- | --------- | ---------------------------------------------------------------------------------- |
| `customer_id` | `number`  | **Required.** The server authorizes on this and returns 403 when it is absent.     |
| `form_id`     | `string`  | Filter by form UUID.                                                               |
| `search`      | `string`  | Search term.                                                                       |
| `order`       | `string`  | `'asc'` or `'desc'` (server default: `desc`).                                      |
| `order_by`    | `string`  | `'title'`, `'updated_at'`, or `'submission_count'` (server default: `created_at`). |
| `archived`    | `boolean` | Filter by archived state.                                                          |
| `active`      | `boolean` | Filter by active state.                                                            |
| `page`        | `number`  | Page number (server default: 1).                                                   |
| `items`       | `number`  | Items per page (server default: 50, max: 100).                                     |

**Returns:** `Promise<object>` — `{ results, page_info }` where `results` is an array of form objects and `page_info` is `{ count, pages, page, items }`.

---

### getFormById(formId)

Get a single form by UUID. Unlike `getForm`, this returns any of the customer's forms, including archived and inactive ones. Requires a scoped API key with the `forms` scope.

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `formId`  | `string` | UUID of the form to retrieve. |

**Returns:** `Promise<object>` — the form object.

---

### createForm(formAttributes)

Create a new form. Requires a scoped API key with the `forms` scope.

| Parameter        | Type     | Description                              |
| ---------------- | -------- | ---------------------------------------- |
| `formAttributes` | `object` | Attributes for the new form (see below). |

Supported `formAttributes` keys:

| Key                            | Type      | Required | Description                                  |
| ------------------------------ | --------- | -------- | -------------------------------------------- |
| `title`                        | `string`  | Yes      | Form title.                                  |
| `form_json`                    | `object`  | Yes      | JSON schema describing form fields.          |
| `customer_id`                  | `number`  | Yes      | Owning customer ID.                          |
| `version`                      | `number`  | Yes      | Form version number.                         |
| `description`                  | `string`  | No       | Optional description.                        |
| `form_html`                    | `string`  | No       | Renderable HTML for the form.                |
| `form_css`                     | `string`  | No       | CSS styles for the form.                     |
| `recipient`                    | `string`  | No       | Recipient of form submissions.               |
| `signable`                     | `boolean` | No       | Whether the form includes a signature field. |
| `signature_confirmation_label` | `string`  | No       | Label for signature confirmation.            |
| `subscription_list_id`         | `string`  | No       | Associated subscription list ID.             |
| `type`                         | `string`  | No       | Form type classification.                    |
| `active`                       | `boolean` | No       | Whether the form accepts submissions.        |
| `submission_count`             | `number`  | No       | Initial submission count.                    |

Only provided keys are sent.

**Returns:** `Promise<object>` — `{ id }` with the UUID of the new form.

---

### updateForm(formId, updates)

Update an existing form. Issued as an HTTP `PUT`, but with merge semantics: only the provided keys are changed; omitted keys are left unchanged server-side. Requires a scoped API key with the `forms` scope.

| Parameter | Type     | Description                             |
| --------- | -------- | --------------------------------------- |
| `formId`  | `string` | UUID of the form to update.             |
| `updates` | `object` | At least one updatable key (see below). |

Updatable keys: `title`, `description`, `form_json`, `recipient`, `active`, `subscription_list_id`.

**Returns:** `Promise<object>` — `{ detail, form_id }`.

---

### archiveForm(formId)

Archive a form. The server also sets `active` to `false`. Requires a scoped API key with the `forms` scope.

| Parameter | Type     | Description                  |
| --------- | -------- | ---------------------------- |
| `formId`  | `string` | UUID of the form to archive. |

**Returns:** `Promise<object>` — `{ detail }`.

---

### unarchiveForm(formId)

Unarchive a previously archived form. Requires a scoped API key with the `forms` scope.

| Parameter | Type     | Description                    |
| --------- | -------- | ------------------------------ |
| `formId`  | `string` | UUID of the form to unarchive. |

**Returns:** `Promise<object>` — `{ detail }`.

---

### copyForm(formId, title)

Copy an existing form to a new form with the given title. The copy gets a fresh `id`, a `null` `vanity_url`, and a `submission_count` of 0. Requires a scoped API key with the `forms` scope.

| Parameter | Type     | Description               |
| --------- | -------- | ------------------------- |
| `formId`  | `string` | UUID of the form to copy. |
| `title`   | `string` | Title for the new form.   |

**Returns:** `Promise<object>` — the new form object.

---

### getFormStats(customerId)

Get aggregate form statistics for a customer. Requires a scoped API key with the `forms` scope.

| Parameter    | Type      | Description                                                           |
| ------------ | --------- | --------------------------------------------------------------------- |
| `customerId` | `number?` | Optional; when omitted the server defaults to the API key's customer. |

**Returns:** `Promise<object>` — `{ active_form_count, total_submission_count, submissions_last_7_days }`.

---

### listSubmissions(formId, params)

List a form's submissions with optional filtering, ordering, and pagination. Requires a scoped API key with the `forms` scope.

| Parameter | Type      | Description                                                         |
| --------- | --------- | ------------------------------------------------------------------- |
| `formId`  | `string`  | UUID of the form whose submissions to list.                         |
| `params`  | `object?` | Optional query parameters; only provided keys are sent (see below). |

Supported `params` keys:

| Key             | Type     | Description                                         |
| --------------- | -------- | --------------------------------------------------- |
| `submission_id` | `string` | Filter to a single submission UUID.                 |
| `order_by`      | `string` | `'submitter_email'` (server default: `created_at`). |
| `order`         | `string` | `'asc'` or `'desc'`.                                |
| `page`          | `number` | Page number.                                        |
| `items`         | `number` | Items per page (max: 100).                          |

**Returns:** `Promise<object>` — `{ data, total, page, items }` where `data` is an array of submission objects (`id`, `form_id`, `form_data` (JSON string), `storage_type`, `storage_url`, `submitter_email`, `recipients`, `attachment_name`, `attachment_url`, `attachment_type`, `attachment`, `created_at`).

---

### exportSubmissionsCsv(formId, submissionId)

Export a form's submissions as CSV (a `Created At` column followed by the form's field labels). Requires a scoped API key with the `forms` scope.

| Parameter      | Type      | Description                                                |
| -------------- | --------- | ---------------------------------------------------------- |
| `formId`       | `string`  | UUID of the form whose submissions to export.              |
| `submissionId` | `string?` | Optional; when provided, only that submission is exported. |

**Returns:** `Promise<string>` — the CSV content.

---

### exportSubmissionPdf(formId, submissionId)

Export a single submission as a PDF. Requires a scoped API key with the `forms` scope.

| Parameter      | Type     | Description                                 |
| -------------- | -------- | ------------------------------------------- |
| `formId`       | `string` | UUID of the form the submission belongs to. |
| `submissionId` | `string` | UUID of the submission to export.           |

**Returns:** `Promise<Buffer | ArrayBuffer>` — the binary PDF content.

---

## message(options)

Construct an email message.

```javascript
const msg = pbMail.message(options);
```

| Option                    | Type       | Required | Description                                                                     |
| ------------------------- | ---------- | -------- | ------------------------------------------------------------------------------- |
| `from`                    | `string`   | Yes      | Sender address.                                                                 |
| `to`                      | `string[]` | Yes      | Recipient addresses.                                                            |
| `subject`                 | `string`   | No       | Email subject line.                                                             |
| `text_content`            | `string`   | No\*     | Plain-text body. At least one of `text_content` or `html_content` is required.  |
| `html_content`            | `string`   | No\*     | HTML body. At least one of `text_content` or `html_content` is required.        |
| `reply_to`                | `string`   | No       | Reply-to address.                                                               |
| `cc`                      | `string[]` | No       | CC addresses.                                                                   |
| `bcc`                     | `string[]` | No       | BCC addresses.                                                                  |
| `allowNonTLS`             | `boolean`  | No       | Allow delivery over non-TLS connections (default: `false`).                     |
| `forceSecureNotification` | `boolean`  | No       | Force secure portal notification instead of inline delivery.                    |
| `list_unsubscribe`        | `string`   | No       | `List-Unsubscribe` header value.                                                |
| `list_unsubscribe_post`   | `string`   | No       | `List-Unsubscribe-Post` header value.                                           |
| `custom_headers`          | `object`   | No       | Key-value pairs; keys must start with `X-` or `x-`.                             |
| `attachments`             | `object[]` | No       | Array of `{ fileName, contentType, content }` objects (base64-encoded content). |

---

## templatedMessage(options)

Construct a templated email message.

```javascript
const msg = pbMail.templatedMessage(options);
```

Accepts the same options as `message()`, plus:

| Option            | Type     | Required | Description                                                           |
| ----------------- | -------- | -------- | --------------------------------------------------------------------- |
| `template_name`   | `string` | Yes      | Name of the dynamic template to use.                                  |
| `template_values` | `object` | Yes      | Key-value pairs substituted into the template's Handlebars variables. |
