const environments = {};

environments.test = {
    from: process.env.TEST_SENDER,
    to: process.env.TEST_RECIPIENT,
    subject: "Test Runner",
    text: "Text content",
    apiKey: process.env.TEST_API_KEY,
    endpointUsername: process.env.TEST_USERNAME
};

environments.dev = {
    from: process.env.DEV_SENDER,
    to: process.env.DEV_RECIPIENT,
    subject: "Test Runner",
    text: "Text content",
    apiKey: process.env.DEV_API_KEY,
    endpointUsername: process.env.DEV_USERNAME
};

const currentEnvironment = typeof ( process.env.NODE_ENV ) == "string" ? process.env.NODE_ENV.toLowerCase() : "";

const environmentToExport = typeof ( environments[ currentEnvironment ] ) == "object" ? environments[ currentEnvironment ] : environments.test;

module.exports = environmentToExport;

