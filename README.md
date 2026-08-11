<!-- markdownlint-disable -->

![Paubox](https://avatars.githubusercontent.com/u/22528478?s=200&v=4)

<!-- markdownlint-restore -->

# Paubox NodeJS <!-- omit from toc -->

This is the official NodeJS wrapper for the [Paubox Email API](https://www.paubox.com/products/paubox-email-api).

The Paubox Email API allows your application to send secure,
compliant email via Paubox and track deliveries and opens.
The API wrapper allows you to construct and send messages.

# Table of Contents <!-- omit from toc -->

- [Installation](#installation)
  - [Getting Paubox API Credentials](#getting-paubox-api-credentials)
  - [Configuring API Credentials](#configuring-api-credentials)
- [Usage](#usage)
  - [Send Message](#send-message)
    - [Allowing non-TLS message delivery](#allowing-non-tls-message-delivery)
    - [Forcing Secure Notifications](#forcing-secure-notifications)
    - [Adding the List-Unsubscribe Header](#adding-the-list-unsubscribe-header)
    - [Adding Attachments](#adding-attachments)
    - [Adding Custom Headers](#adding-custom-headers)
  - [Send Bulk Messages](#send-bulk-messages)
  - [Get Email Disposition](#get-email-disposition)
  - [Dynamic Templates](#dynamic-templates)
    - [Create Dynamic Template](#create-dynamic-template)
    - [Update Dynamic Template](#update-dynamic-template)
    - [Delete Dynamic Template](#delete-dynamic-template)
    - [Get Dynamic Template](#get-dynamic-template)
    - [List Dynamic Templates](#list-dynamic-templates)
    - [Send a Dynamically Templated Message](#send-a-dynamically-templated-message)
  - [Paubox Forms](#paubox-forms)
    - [Get Form](#get-form)
    - [Submit Form](#submit-form)
    - [Authenticated form management](#authenticated-form-management)
- [Supported Node Versions](#supported-node-versions)
- [Contributing](#contributing)
- [License](#license)
- [Copyright](#copyright)

Further documentation can be found at [docs.paubox.com](https://docs.paubox.com/welcome).

## Installation

Using npm:

```bash
npm install --save paubox-node
```

### Getting Paubox API Credentials

You will need to have a Paubox account. You can [sign up here](https://www.paubox.com/pricing/paubox-email-api).

Once you have an account, follow the instructions on the Rest API dashboard to verify domain ownership and generate API credentials.

### Configuring API Credentials

Include your API credentials in your environment file.

Your "API Username" comes from your unique API endpoint.

**Base URL:** `https://api.paubox.net/v1/<USERNAME>`

```bash
echo "API_KEY='YOUR_API_KEY'" > .env
echo "API_USERNAME='YOUR_ENDPOINT_NAME'" >> .env
echo ".env" >> .gitignore
```

Or pass them as parameters when creating emailService

```javascript
const pbMail = require('paubox-node');
const pauboxConfig = {
  apiUsername: 'your-api-username',
  apiKey: 'your-api-key',
};
const service = pbMail.emailService(pauboxConfig);
```

## Usage

To send email, prepare a Message object and call the sendMessage method of
emailService.

### Send Message

Please also see the [API Documentation](https://docs.paubox.com/email-api/messages).

Please also see [Sending a Dynamically Templated Message](#send-a-dynamically-templated-message) for sending a message
using a dynamic template.

```javascript
'use strict';

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var options = {
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
};

var message = pbMail.message(options);

service
  .sendMessage(message)
  .then((response) => {
    console.log('Send Message method Response: ' + JSON.stringify(response));
  })
  .catch((error) => {
    console.log('Error in Send Message method: ' + JSON.stringify(error));
  });
```

#### Allowing non-TLS message delivery

If you want to send non-PHI mail that does not need to be HIPAA compliant, you can allow the message delivery to take place even if a TLS connection is unavailable.

This means the message will not be converted into a secure portal message when a nonTLS connection is encountered. To do this, include `allowNonTLS: true` in the options, as shown below:

```javascript
'use strict';

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var options = {
  allowNonTLS: true,
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
};

var message = pbMail.message(options);
```

#### Forcing Secure Notifications

Paubox Secure Notifications allow an extra layer of security, especially when coupled with an organization's requirement for message recipients to use 2-factor authentication to read messages (this setting is available to org administrators in the Paubox Admin Panel).

Instead of receiving an email with the message contents, the recipient will receive a notification email that they have a new message in Paubox.

```javascript
'use strict';

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var options = {
  forceSecureNotification: 'true',
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
};

var message = pbMail.message(options);
```

#### Adding the List-Unsubscribe Header

The List-Unsubscribe header provides the recipient with the option to easily opt-out of receiving any future communications. A more detailed explanation and usage guide for this header can be found at our [docs here.](https://docs.paubox.com/email-api/messages)

This header can be used by adding the `list_unsubscribe: '<Email Unsubscribe Address>, <Web Unsubscribe URL'` and `list_unsubscribe_post: 'List-Unsubscribe=One-Click'` key-value pairs to the options object as follows:

```javascript
'use strict';

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var options = {
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
  list_unsubscribe:
    '<mailto: unsubscribe@example.com?subject=unsubscribe>, <http://www.example.com/unsubscribe.html>',
  list_unsubscribe_post: 'List-Unsubscribe=One-Click',
};

var message = pbMail.message(options);
```

#### Adding Attachments

```javascript
'use strict';

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var attachmentContent = Buffer.from('Hello! This is the attachment content!').toString('base64');

var options = {
  from: 'sender@domain.com',
  reply_to: 'reply_to@domain.com',
  to: ['recipient@example.com'],
  bcc: ['recipient2@example.com'],
  cc: ['recipientcc@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
  attachments: [
    {
      fileName: 'HelloWorld.txt',
      contentType: 'text/plain',
      content: attachmentContent,
    },
  ],
};

var message = pbMail.message(options);
```

#### Adding Custom Headers

You can add custom headers to a message by passing a `custom_headers` object to the message options.

As mentioned in the [API Documentation](https://docs.paubox.com/email-api/messages), custom
headers must be prepended with `X-` (or `x-`). Custom headers should be passed as a JSON object as a key-value pair. Example:

```json
{
  "X-My-First-Header": "My First Value",
  "X-My-Second-Header": "My Second Value"
}
```

Full example:

```javascript
'use strict';

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var options = {
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Testing custom headers',
  custom_headers: {
    'X-My-First-Header': 'My First Value',
    'X-My-Second-Header': 'My Second Value',
  },
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
};

var message = pbMail.message(options);

service
  .sendMessage(message)
  .then((response) => {
    console.log('Send Message method Response: ' + JSON.stringify(response));
  })
  .catch((error) => {
    console.log('Error in Send Message method: ' + JSON.stringify(error));
  });
```

### Send Bulk Messages

Please also see the [API Documentation](https://docs.paubox.com/email-api/bulk-messages).

> We recommend batches of 50 (fifty) or less. Source tracking ids are returned in order messages appear in the messages
> array.

```javascript
'use strict';

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

// Create a Message for Alice
var messageAlice = pbMail.message({
  from: 'sender@domain.com',
  to: ['alice@example.com'],
  subject: 'Hello Alice!',
  text_content: 'Hello Alice!',
  html_content: '<html><head></head><body><h1>Hello Alice!</h1></body></html>',
});

// Create a Message for Bob
var messageBob = pbMail.message({
  from: 'sender@domain.com',
  to: ['bob@example.com'],
  custom_headers: {
    // Custom headers are also supported for bulk messages, and can differ per message
    'X-Custom-Header-1': 'Value 1',
    'X-Custom-Header-2': 'Value 2',
  },
  subject: 'Hello Bob!',
  text_content: 'Hello Bob!',
  html_content: '<html><head></head><body><h1>Hello Bob!</h1></body></html>',
});

service
  .sendBulkMessages([messageAlice, messageBob])
  .then((response) => {
    console.log('Send Message method Response: ' + JSON.stringify(response));
  })
  .catch((error) => {
    console.log('Error in Send Message method: ' + JSON.stringify(error));
  });
```

The same options as the [sendMessage](#send-message) method are available for the sendBulkMessages method, including
custom headers.

### Get Email Disposition

Please also see the [API Documentation](https://docs.paubox.com/email-api/message-receipt).

The SOURCE_TRACKING_ID of a message is returned in the response of the sendMessage method. To check the status for any email, use its source tracking id and call the getEmailDisposition method of emailService:

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

service.getEmailDisposition('SOURCE_TRACKING_ID').then(function (response) {
  console.log('Get Email Disposition method Response: ' + JSON.stringify(response));
});
```

### Dynamic Templates

#### Create Dynamic Template

Please also see the [API Documentation](https://docs.paubox.com/email-api/dynamic-templates/create).

You can create a dynamic template by passing in a string, a file Buffer, or file Stream.

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

const templateName = 'your_template_name';
const templateContent = '<html><body><h1>Hello {{firstName}}!</h1></body></html>';

service.createDynamicTemplate(templateName, templateContent).then(function (response) {
  console.log('Create Dynamic Template method Response: ' + JSON.stringify(response));
});
```

In a simple express app, this could look something like this:

```javascript
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

app.post('/api/create-dynamic-template', upload.single('templateFile'), async (req, res) => {
  try {
    const { templateName } = req.body;
    const templateFile = req.file;

    const content = templateFile.buffer;
    const response = await service.createDynamicTemplate(templateName, content);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Update Dynamic Template

Please also see the [API Documentation](https://docs.paubox.com/email-api/dynamic-templates/update).

You can update a dynamic template's content and/or name:

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

const templateId = 123; // You would get this from the listDynamicTemplates method (see below)
const templateName = 'New Name';
const templateContent = '<html><body><h1>Hello {{firstName}}!</h1></body></html>'; // New content

service.updateDynamicTemplate(templateId, templateName, templateContent).then(function (response) {
  console.log('Update Dynamic Template method Response: ' + JSON.stringify(response));
});

// Or just update the content
service.updateDynamicTemplate(templateId, null, templateContent).then(function (response) {
  console.log('Update Dynamic Template method Response: ' + JSON.stringify(response));
});
```

In a simple express app, this could look something like this:

```javascript
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

app.patch(
  '/api/update-dynamic-template/:templateId',
  upload.single('templateFile'),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const { templateName } = req.body;
      const templateFile = req.file;

      const content = templateFile.buffer;
      const response = await service.updateDynamicTemplate(templateId, templateName, content);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);
```

#### Delete Dynamic Template

Please also see the [API Documentation](https://docs.paubox.com/email-api/dynamic-templates/delete).

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

const templateId = 123; // You would get this from the listDynamicTemplates method (see below)

service.deleteDynamicTemplate(templateId).then(function (response) {
  console.log('Delete Dynamic Template method Response: ' + JSON.stringify(response));
});
```

#### Get Dynamic Template

Please also see the [API Documentation](https://docs.paubox.com/email-api/dynamic-templates/get).

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

const templateId = 123; // You would get this from the listDynamicTemplates method (see below)

service.getDynamicTemplate(templateId).then(function (response) {
  console.log('Get Dynamic Template method Response: ' + JSON.stringify(response));
});
```

#### List Dynamic Templates

Please also see the [API Documentation](https://docs.paubox.com/email-api/dynamic-templates).

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

service.listDynamicTemplates().then(function (response) {
  console.log('List Dynamic Templates method Response: ' + JSON.stringify(response));
});
```

#### Send a Dynamically Templated Message

Please also see the [API Documentation](https://docs.paubox.com/email-api/templated-messages).

For example, assume you have a dynamic template named `welcome_email` with the following content:

```html
<html>
  <body>
    <h1>Welcome {{firstName}} {{lastName}}!</h1>
  </body>
</html>
```

You can send a message using this template by doing the following:

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

const templateName = 'welcome_email';
const templateValues = {
  firstName: 'John',
  lastName: 'Doe',
};

var templatedMessage = pbMail.templatedMessage({
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Welcome!',
  template_name: templateName,
  template_values: templateValues,
});

service
  .sendTemplatedMessage(templatedMessage)
  .then((response) => {
    console.log('Send Templated Message method Response: ' + JSON.stringify(response));
  })
  .catch((error) => {
    console.log('Error in Send Templated Message method: ' + JSON.stringify(error));
  });
```

**Note**: Custom headers are currently not supported for templated messages.

### Paubox Forms

The Paubox Forms endpoints for fetching a form definition and submitting responses are **public** — no API key or username is required. Use `pbMail.formService()` to get a service instance. Form-management endpoints require a scoped API key — see [Authenticated form management](#authenticated-form-management) below.

#### Get Form

Please also see the [API Documentation](https://docs.paubox.com/forms/get-form).

Returns the full form definition (HTML, JSON schema, CSS) for a given form. This is typically called before rendering a form embed.

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.formService();

const formId = '550e8400-e29b-41d4-a716-446655440000';

service
  .getForm(formId)
  .then((form) => {
    console.log('Get Form Response: ' + JSON.stringify(form));
    // form.form_html contains the renderable HTML
    // form.form_json contains the field schema
  })
  .catch((error) => {
    console.log('Error in Get Form: ' + JSON.stringify(error));
  });
```

#### Submit Form

Please also see the [API Documentation](https://docs.paubox.com/forms/submit-form).

Submits a respondent's answers for a form. The keys in `formData` should match the form's field schema (`form_json`). Returns `null` on success (HTTP 201 No Content). Maximum request size is 250 MB to support file attachments.

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.formService();

const formId = '550e8400-e29b-41d4-a716-446655440000';

const formData = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
};

service
  .submitForm(formId, formData)
  .then(() => {
    console.log('Form submitted successfully');
  })
  .catch((error) => {
    console.log('Error submitting form: ' + JSON.stringify(error));
  });
```

To submit a form with file attachments, pass an array of attachment objects with `name` (filename) and `content` (base64-encoded file content):

```javascript
'use strict';
const fs = require('fs');
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.formService();

const formId = '550e8400-e29b-41d4-a716-446655440000';

const formData = { first_name: 'Jane' };

const attachments = [
  {
    name: 'consent.pdf',
    content: fs.readFileSync('./consent.pdf').toString('base64'),
  },
];

service
  .submitForm(formId, formData, attachments)
  .then(() => {
    console.log('Form submitted successfully');
  })
  .catch((error) => {
    console.log('Error submitting form: ' + JSON.stringify(error));
  });
```

#### Authenticated form management

The form-management methods require a **scoped API key with the `forms` scope**. Pass it as `{ apiKey }` when creating the service, or set the `FORMS_API_KEY` environment variable:

```bash
echo "FORMS_API_KEY='YOUR_SCOPED_API_KEY'" >> .env
```

```javascript
'use strict';
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.formService(); // reads FORMS_API_KEY from the environment

// Or pass the key explicitly:
// const service = pbMail.formService({ apiKey: 'your-scoped-api-key' });
```

Calling an authenticated method without an API key throws an error. The public `getForm` and `submitForm` methods work with or without a key.

List forms, with optional filtering, ordering, and pagination:

```javascript
service
  .listForms({ search: 'intake', order_by: 'updated_at', order: 'desc', page: 1, items: 25 })
  .then((response) => {
    console.log('Forms: ' + JSON.stringify(response.results));
    console.log('Page info: ' + JSON.stringify(response.page_info));
  })
  .catch((error) => {
    console.log('Error listing forms: ' + JSON.stringify(error));
  });
```

Get a single form by id (unlike the public `getForm`, this returns any of the customer's forms, including archived and inactive ones):

```javascript
const formId = '550e8400-e29b-41d4-a716-446655440000';

service
  .getFormById(formId)
  .then((form) => {
    console.log('Form: ' + JSON.stringify(form));
  })
  .catch((error) => {
    console.log('Error getting form: ' + JSON.stringify(error));
  });
```

Create a form:

```javascript
service
  .createForm({
    title: 'Patient Intake',
    form_json: { fields: [{ label: 'First Name', type: 'text' }] },
    customer_id: 123,
    version: 1,
    description: 'New patient intake form',
    recipient: 'intake@example.com',
    active: true,
  })
  .then((response) => {
    console.log('New form id: ' + response.id);
  })
  .catch((error) => {
    console.log('Error creating form: ' + JSON.stringify(error));
  });
```

Update a form (only the provided keys are changed; omitted keys are left unchanged):

```javascript
const formId = '550e8400-e29b-41d4-a716-446655440000';

service
  .updateForm(formId, { title: 'Patient Intake (v2)', active: false })
  .then((response) => {
    console.log('Update Form Response: ' + JSON.stringify(response));
  })
  .catch((error) => {
    console.log('Error updating form: ' + JSON.stringify(error));
  });
```

Archive or unarchive a form (archiving also sets `active` to `false`):

```javascript
service.archiveForm(formId).then((response) => {
  console.log(response.detail); // "Form archived."
});

service.unarchiveForm(formId).then((response) => {
  console.log(response.detail); // "Form unarchived."
});
```

Copy a form (the copy gets a fresh id, no vanity URL, and a submission count of 0):

```javascript
service
  .copyForm(formId, 'Patient Intake (copy)')
  .then((newForm) => {
    console.log('New form: ' + JSON.stringify(newForm));
  })
  .catch((error) => {
    console.log('Error copying form: ' + JSON.stringify(error));
  });
```

Get aggregate form statistics (defaults to the API key's customer when no customer ID is given):

```javascript
service.getFormStats().then((stats) => {
  console.log('Active forms: ' + stats.active_form_count);
  console.log('Total submissions: ' + stats.total_submission_count);
  console.log('Submissions in the last 7 days: ' + stats.submissions_last_7_days);
});
```

List a form's submissions:

```javascript
service
  .listSubmissions(formId, { order: 'desc', page: 1, items: 50 })
  .then((response) => {
    console.log('Submissions: ' + JSON.stringify(response.data));
    console.log('Total: ' + response.total);
  })
  .catch((error) => {
    console.log('Error listing submissions: ' + JSON.stringify(error));
  });
```

Export submissions as CSV — all of a form's submissions, or a single one:

```javascript
const fs = require('fs');

service.exportSubmissionsCsv(formId).then((csv) => {
  fs.writeFileSync('./submissions.csv', csv);
});

// Export a single submission
const submissionId = 'b3b8c7e2-1d2f-4c5a-9e8d-7f6a5b4c3d2e';
service.exportSubmissionsCsv(formId, submissionId).then((csv) => {
  fs.writeFileSync('./submission.csv', csv);
});
```

Export a single submission as a PDF:

```javascript
const fs = require('fs');

service.exportSubmissionPdf(formId, submissionId).then((pdf) => {
  fs.writeFileSync('./submission.pdf', Buffer.from(pdf));
});
```

## Supported Node Versions

Currently supported Node versions are:

- Node v22.16.x (LTS Jod)
- Node v24

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

See [LICENSE](LICENSE)

## Copyright

Copyright &copy; 2025, Paubox, Inc.

## 💬 Community & support

Questions, ideas, or want to share what you built? Join the **[Paubox Community](https://github.com/Paubox/community/discussions)** — the single home for discussions across every Paubox SDK and API.

🔐 Found a security issue? Email **devops@paubox.com** — please don't post it publicly.
