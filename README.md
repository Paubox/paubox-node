## Setting up Environment Variables
Create a .env file in the project root directory and add the following:

```
TEST_SENDER="sender@yourdomain.com"

TEST_RECIPIENT="recipient@receivingdomain.com"

TEST_API_KEY="insert API key"

TEST_USERNAME="API endpoint username"
```

## Compiling ES6 to ES5 in Development
```bash
npx babel --presets env ./src --out-dir ./lib
```

## Running Tests
```
npm test

```