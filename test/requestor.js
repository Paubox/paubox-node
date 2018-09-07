// "use strict";

// const expect = require("chai").expect;
// const assert = require("chai").assert;
// const requestor = require("../lib/requestor.js");
// const config = require("./data/config.js");

// const postBody = {
//   data: {
//     message: {
//       recipients: [config.to],
//       headers: {
//         subject: config.subject,
//         from: config.from
//       },
//       content: {
//         "text/plain": config.text
//       }
//     }
//   }
// };

// const postOptions = {
//   url: `https://api.paubox.net/v1/${config.endpointUsername}/messages`,
//   apiKey: config.apiKey,
//   body: postBody
// };

// describe("Requestor", () => {
//   it("builds headers", () => {
//     let request = requestor(config);
//     expect(request.headers["content-type"]).to.equal("application/json");
//   });
// });
