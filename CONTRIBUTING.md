# Contributing

Bug reports and pull requests are welcome on GitHub at <https://github.com/paubox/paubox-node>.

## Setting up

1. Install [nvm](https://github.com/nvm-sh/nvm):

   ```sh
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
   ```

2. Clone the repo
3. Install node version:

   ```sh
   nvm install lts/jod
   ```

4. Activate `nvm`:

   ```sh
   nvm use
   ```

5. Install dependencies

   ```sh
   npm install
   ```

## Running tests

Running tests once:

```sh
npm run test
```

Running tests in watch mode:

```sh
npm run test:watch
```

### Debugging with VSCode

1. To run tests in debug mode, you can firstly add a breakpoint in the code:

   ```js
   // code...
   debugger; // Adds a breakpoint
   ```

2. Then click on the Debug icon in the Activity Bar on the left side of the screen.
3. Select `Debug Mocha Tests` from the dropdown.
4. Click the green play button to start debugging.
5. Refer to `.vscode/launch.json` for more details.

### Debugging with Chrome DevTools

If you do not use VSCode, you can use Chrome DevTools to debug the tests by following the steps below.

1. To run tests in debug mode, you can firstly add a breakpoint in the code:

   ```js
   // code...
   debugger; // Adds a breakpoint
   ```

2. Then run:

   ```sh
   npm run test:debug
   ```

3. Open Google Chrome and go to `chrome://inspect` (or `edge://inspect` if you use Microsoft Edge).

4. Click on `Open dedicated DevTools for Node` to open the Chrome DevTools.

5. The Chrome DevTools will open and you can set breakpoints, inspect variables, etc.

## Linting

1. Run linting to detect problems:

   ```sh
   npm run lint
   ```

2. Fix auto-correctable problems:

   ```sh
   npm run lint:fix
   ```

3. Format code using Prettier:

   ```sh
   npm run format
   ```

## Building

Build config is specified in [.babelrc](.babelrc).

Run:

```sh
npm run build
```

Building does the following:

Refer to [package.json](package.json) for more details.
