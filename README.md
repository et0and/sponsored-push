# sponsored-push™

A `prepare-commit-msg` git hook that appends a sponsored message to every commit. Works standalone or with [Husky](https://typicode.github.io/husky/). Ads are fetched from a remote `ads.txt` file at commit time, with a built-in fallback list if the request fails.

If it isn't already obvious, this is a pisstake.

```bash
feat: fix login bug

# sponsored
# Magic Spoon: high-protein, low-carb cereal that tastes like the Saturday
#    morning cartoons of your childhood. Code: COMMITS for free shipping.
```

---

## Requirements

- Node.js 24 or later
- Git

---

## Installation

```bash
npm install --save-dev sponsored-push
```

The `prepare-commit-msg` hook is registered automatically via the `prepare` npm lifecycle script. No additional setup is needed for most projects.

To verify the hook was installed:

```bash
cat .git/hooks/prepare-commit-msg
```

---

## Usage

Once installed, the hook runs automatically on every `git commit`. No command needs to be run manually.

To run it directly against a commit message file:

```bash
npx sponsored-push .git/COMMIT_EDITMSG
```

---

## Husky

If your project uses Husky, the installer will detect it and skip the automatic `.git/hooks` setup, printing manual instructions instead. To wire it up yourself, add the following to `.husky/prepare-commit-msg`:

```sh
#!/bin/sh
npx sponsored-push "$1"
```

Then make it executable:

```bash
chmod +x .husky/prepare-commit-msg
```

### Setting up Husky from scratch

```bash
npm install --save-dev husky sponsored-push
npx husky init
echo 'npx sponsored-push "$1"' >> .husky/prepare-commit-msg
chmod +x .husky/prepare-commit-msg
```

### With lint-staged

If you're already using `lint-staged`, your `package.json` might look like this:

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts}": "eslint --fix"
  }
}
```

And `.husky/prepare-commit-msg`:

```sh
#!/bin/sh
npx lint-staged
npx sponsored-push "$1"
```

---

## How ads are loaded

On each commit, `sponsored-push` will:

1. Make an HTTP request to the configured `ADS_URL` (default: `https://cdn.tom.so/ads.txt`) with a 3-second timeout
2. Parse the response — one ad per line, lines beginning with `#` are treated as comments
3. Select one ad at random and append it to the commit message as a `#` comment

The ad is appended as a git comment, which means it is visible in your editor during the commit but is **not stored in the commit body** — it won't show up in `git log`.

If the remote fetch fails for any reason (network unavailable, non-200 response, timeout), `sponsored-push` falls back to a built-in list of ads and continues without error.

### Hosting your own ads.txt

To use a custom ad list, update the `ADS_URL` constant at the top of `bin/sponsored-push.js`:

```js
const ADS_URL = "https://your-cdn.example.com/ads.txt";
```

The format is plain text, one ad per line:

```
# ads.txt — lines starting with # are ignored
This commit sponsored by HelloFresh. Use code DEPLOY16 for 16 free meals.
Brought to you by NordVPN. Code: GITPUSH for 68% off.
```

---

## Skipped commits

`sponsored-push` will not modify the commit message for:

- Merge commits (message begins with `Merge`)
- Fixup commits (`fixup!` or `squash!` prefix)
- Empty commit messages

---

## CI environments

The install script checks for the `CI` and `CONTINUOUS_INTEGRATION` environment variables and skips hook registration automatically, so it won't interfere with your pipeline.
