# Paubox NodeJS

This is the official NodeJS wrapper for the [Paubox Transactional Email API](https://www.paubox.com/solutions/email-api). It is currently in alpha development.

The Paubox Transactional Email API allows your application to send secure, HIPAA-compliant email via Paubox and track deliveries and opens.
The API wrapper allows you to construct and send messages.

# Table of Contents
* [Installation](#installation)
*  [Usage](#usage)
*  [Contributing](#contributing)
*  [License](#license)

<a name="#installation"></a>
## Installation

Using npm:

```bash
$ npm install --save paubox-node
```

### Getting Paubox API Credentials
You will need to have a Paubox account. You can [sign up here](https://www.paubox.com/join/see-pricing?unit=messages).

Once you have an account, follow the instructions on the Rest API dashboard to verify domain ownership and generate API credentials.

### Configuring API Credentials

Include your API credentials in your environment file.

```bash
$ echo "API_KEY='YOUR_API_KEY'" > .env
$ echo "API_USERNAME='YOUR_ENDPOINT_NAME'" >> .env
$ echo ".env" >> .gitignore
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

<a name="#usage"></a>
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

If you want to send non-PHI mail that does not need to be HIPAA-compliant, you can allow the message delivery to take place even if a TLS connection is unavailable.

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

<a name="#contributing"></a>
## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/paubox/paubox-node.


<a name="#license"></a>
## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Copyright
Copyright &copy; 2018, Paubox Inc.
