![Paubox](https://avatars.githubusercontent.com/u/22528478?s=200&v=4)

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
  - [Sending messages](#sending-messages)
  - [Allowing non-TLS message delivery](#allowing-non-tls-message-delivery)
  - [Forcing Secure Notifications](#forcing-secure-notifications)
  - [Adding the List-Unsubscribe Header](#adding-the-list-unsubscribe-header)
  - [Adding Attachments and Additional Headers](#adding-attachments-and-additional-headers)
  - [Checking Email Dispositions](#checking-email-dispositions)
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

### Sending messages

```javascript
"use strict";

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var options = {
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
}

var message = pbMail.message(options)

service.sendMessage(message)
  .then(response => {
    console.log("Send Message method Response: " + JSON.stringify(response));
  }).catch(error => {
    console.log("Error in Send Message method: " + JSON.stringify(error));
  });
```

### Allowing non-TLS message delivery

If you want to send non-PHI mail that does not need to be HIPAA compliant, you can allow the message delivery to take place even if a TLS connection is unavailable.

This means the message will not be converted into a secure portal message when a nonTLS connection is encountered. To do this, include `allowNonTLS: true` in the options, as shown below:

```javascript
"use strict";

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
}

var message = pbMail.message(options)
```

### Forcing Secure Notifications

Paubox Secure Notifications allow an extra layer of security, especially when coupled with an organization's requirement for message recipients to use 2-factor authentication to read messages (this setting is available to org administrators in the Paubox Admin Panel).

Instead of receiving an email with the message contents, the recipient will receive a notification email that they have a new message in Paubox.

```javascript
"use strict";

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
}

var message = pbMail.message(options)
```

### Adding the List-Unsubscribe Header

The List-Unsubscribe header provides the recipient with the option to easily opt-out of receiving any future communications. A more detailed explaination and usage guide for this header can be found at our [docs here.](https://docs.paubox.com/docs/paubox_email_api/messages/#list-unsubscribe)

This header can be used by adding the `list_unsubscribe: '<Email Unsubscribe Address>, <Web Unsubscribe URL'` and `list_unsubscribe_post: 'List-Unsubscribe=One-Click'` key-value pairs to the options object as follows:

```javascript
"use strict";

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var options = {
  from: 'sender@domain.com',
  to: ['recipient@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
  list_unsubscribe: '<mailto: unsubscribe@example.com?subject=unsubscribe>, <http://www.example.com/unsubscribe.html>',
  list_unsubscribe_post: 'List-Unsubscribe=One-Click'
}

var message = pbMail.message(options)
```

### Adding Attachments and Additional Headers

```javascript
"use strict";

require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

var attachmentContent = Buffer.from('Hello! This is the attachment content!').toString('base64')

var options = {
  from: 'sender@domain.com',
  reply_to: 'reply_to@domain.com',
  to: ['recipient@example.com'],
  bcc: ['recipient2@example.com'],
  cc: ['recipientcc@example.com'],
  subject: 'Testing!',
  text_content: 'Hello World!',
  html_content: '<html><head></head><body><h1>Hello World!</h1></body></html>',
  attachments: [{
    fileName: "HelloWorld.txt",
    contentType: "text/plain",
    content: attachmentContent
  }]
}

var message = pbMail.message(options)
```

### Checking Email Dispositions

The SOURCE_TRACKING_ID of a message is returned in the response of the sendMessage method. To check the status for any email, use its source tracking id and call the getEmailDisposition method of emailService:

```javascript
"use strict";
require('dotenv').config();
const pbMail = require('paubox-node');
const service = pbMail.emailService();

service.getEmailDisposition("SOURCE_TRACKING_ID")
  .then(function (response) {
      console.log("Get Email Disposition method Response: " + JSON.stringify(response));
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
