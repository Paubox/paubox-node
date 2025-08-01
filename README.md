<!-- markdownlint-disable -->

![Paubox](https://avatars.githubusercontent.com/u/22528478?s=200&v=4)

<!-- markdownlint-restore -->

# Paubox NodeJS <!-- omit from toc -->

This is the official NodeJS wrapper for the [Paubox Email API](https://www.paubox.com/solutions/email-api).

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
- [Supported Node Versions](#supported-node-versions)
- [Contributing](#contributing)
- [License](#license)
- [Copyright](#copyright)

Further documentation can be found at [docs.paubox.com](https://docs.paubox.com/docs/paubox_email_api/introduction/).

## Installation

Using npm:

```bash
npm install --save paubox-node
```

### Getting Paubox API Credentials

You will need to have a Paubox account. You can [sign up here](https://www.paubox.com/join/see-pricing?unit=messages#paubox-email-api).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/messages#send-message).

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

The List-Unsubscribe header provides the recipient with the option to easily opt-out of receiving any future communications. A more detailed explanation and usage guide for this header can be found at our [docs here.](https://docs.paubox.com/docs/paubox_email_api/messages/#list-unsubscribe)

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

As mentioned in the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/messages/#send-message), custom
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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/messages#send-bulk-messages).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/messages#get-email-disposition).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#create-a-dynamic-template).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#update-a-dynamic-template).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#delete-a-dynamic-template).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#view-one-of-your-orgs-dynamic-templates).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#view-all-your-orgs-dynamic-templates).

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

Please also see the [API Documentation](https://docs.paubox.com/docs/paubox_email_api/dynamic_templates#send-a-dynamically-templated-message).

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
