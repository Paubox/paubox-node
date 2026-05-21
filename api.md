# Paubox Node API Reference

This document describes all public methods exposed by `paubox-node`.

---

## emailService

Create a service instance to send email and manage dynamic templates.

```javascript
const pbMail = require('paubox-node');
const service = pbMail.emailService({ apiUsername: '...', apiKey: '...' });
```

Credentials can also be loaded from environment variables `API_USERNAME` and `API_KEY`.

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

Create a service instance for Paubox Forms. **No API credentials required.**

```javascript
const pbMail = require('paubox-node');
const service = pbMail.formService();
```

Base URL: `https://apx.paubox.com/forms`

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
