## Setting up Environment Variables
Create a .env file in the project root directory and add the following:

API_KEY="insert API key"

API_USERNAME="API endpoint username"
```

## Compiling ES6 to ES5 in Development
```bash
npx babel --presets env ./src --out-dir ./lib
```

## Running Tests
```
npm test

```