## Getting Started

### Prerequisites
Make sure you have installed the following: 
- a package manager (e.g., homebrew for macOS, apt for Ubuntu, etc.)
- git
- nvm (Node Version Manager)
- direnv (auto-loads environment variables)
   - **Beginner Hints**: before `direnv` works you need to hook it into your shell: depending on which shell you're using (find out with `echo $SHELL`)
   - add `eval "$(direnv hook bash)"` to your `~/.bashrc`  OR  `eval "$(direnv hook zsh)"` to your `~/.zshrc` (create those files if they don't exist yet).
   - After that, restart the terminal or run `source ~/.bashrc` OR `source ~/.zshrc`.
    


### Initial setup
#### 1.)
When cloning the repo, you should pass `--recurse-submodules` to the `git clone` invocation to ensure you also
   get the `kausal_common` submodule checked out. 
```bash
git clone --recurse-submodules
```
If you already have a pre-existing clone, you can update the submodule with:
```bash
git submodule update --init
```

Navigate to the paths-ui folder. Allow loading environment variables:
```bash
direnv allow
```

#### 2.)
Activate the right node version (you can do all steps from 2 to 5 to make sure that the update does not fail).
The right node version should show with the command
```bash
cat .nvmrc
```
Install the number the .nvmrc file says and activate it
```bash
nvm install [insert node number]
nvm use [insert node number]
```

#### 3.)
Make sure the pnpm version is controlled with corepack:

```bash
corepack enable npm
```

#### 4.)
If you need access to the Kausal private themes:

```
npx verdaccio-openid@latest --registry https://npm.kausal.tech
pnpm config set @kausal-private:registry https://npm.kausal.tech
```

#### 5.)
Install dependencies:

```bash
pnpm i
```

Make sure that your installation does not give errors about missing files. If it does, there is probably something wrong in step 4.

#### 6.)
To run local development against a Kausal Paths backend, create an `.env` file with the following env variable set to the staging GraphQL API URL. Ask a teammate for this value.

```
PATHS_BACKEND_URL=
```

### Running the local dev server

Start the development server with:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Note: The address mentioned may differ depending on the instance you are using. For example, it could be something like `http://sunnydale.localhost:3000`.

#### Useful Commands
```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm test

# Update dependencies
pnpm update

# Switch to project's Node version
nvm use [other node number]
```



## Development

If you want to run the UI against your own backend, configure it in `.env`:

```
PATHS_BACKEND_URL=http://localhost:8000
```

## Deployment

GitHub actions are configured to handle continuous deployment when `deployment/*` branches are updated.
To avoid merge conflicts and ensure deployment branches stay up to date with `main`, you can push `main` directly to the deployment branch via:

```bash
git push origin main:deployment/testing
```

Swap `deployment/testing` out for any of the following depending on the environment you want to update:

- `deployment/production`: The production environment used by customers and end users
- `deployment/testing`: The test environment used by customers and end users
- `deployment/staging`: The staging environment primarily used by Kausal, this can be used as a playground and doesn't need to be stable.

## Sentry

When you call sentry-cli (which probably happens automatically when you deploy this project), you need to set an auth token. You can supply this in the environment variable `SENTRY_AUTH_TOKEN` or in a file called `.sentryclirc`, for example like this:

```
[auth]
token=your-auth-token
```
