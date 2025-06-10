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

```sh
npm run test
```

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
