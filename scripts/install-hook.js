#!/usr/bin/env node
"use strict";

/**
 * scripts/install-hook.js
 *
 * Run automatically after `npm install`. Writes a prepare-commit-msg hook
 * into .git/hooks/ if no Husky setup is detected.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HOOK_NAME = "prepare-commit-msg";

function findGitRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function huskyPresent(root) {
  // Husky v8+ uses .husky/ directory; v4 used husky key in package.json
  const huskyDir = path.join(root, ".husky");
  if (fs.existsSync(huskyDir)) return true;
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    );
    return !!(pkg.husky || (pkg.devDependencies && pkg.devDependencies.husky));
  } catch {
    return false;
  }
}

function main() {
  // Skip in CI environments
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
    console.log("[sponsored-push™] CI detected, skipping hook install.");
    return;
  }

  const root = findGitRoot(process.cwd());
  if (!root) {
    console.log(
      "[sponsored-push™] Not inside a git repo, skipping hook install.",
    );
    return;
  }

  if (huskyPresent(root)) {
    console.log(`
[sponsored-push™] Husky detected! Add this to your .husky/prepare-commit-msg:

  #!/bin/sh
  npx sponsored-push "$1"

Or run:
  echo 'npx sponsored-push "$1"' >> .husky/prepare-commit-msg
  chmod +x .husky/prepare-commit-msg
`);
    return;
  }

  // Plain git hooks install
  const hooksDir = path.join(root, ".git", "hooks");
  const hookPath = path.join(hooksDir, HOOK_NAME);

  const hookContent = `#!/bin/sh
# sponsored-push™ — a git hook for the attention economy
npx sponsored-push "$1"
`;

  // If hook already exists, append rather than overwrite
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, "utf8");
    if (existing.includes("sponsored-push")) {
      console.log("[sponsored-push™] Hook already installed, nothing to do.");
      return;
    }
    fs.appendFileSync(hookPath, "\n" + 'npx sponsored-push "$1"\n');
    console.log(
      "[sponsored-push] Appended to existing prepare-commit-msg hook.",
    );
  } else {
    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log("[sponsored-push™] ✅ prepare-commit-msg hook installed.");
  }

  // Ensure executable on Unix
  try {
    execSync(`chmod +x "${hookPath}"`);
  } catch {
    /* Windows — not needed */
  }
}

main();
