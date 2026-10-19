# Executable, package wiring and smoke spec

Add the executable shim and wire it into the package.

- `client/bin/majora.js`: `#!/usr/bin/env node`, mode `755` (commit with the executable bit).
  It only builds `Cli` with the real process io (`process.env`, `process.stdin`,
  `process.stdout`, `process.stderr`, `globalThis.fetch`, `node:fs/promises`), installs a
  `SIGINT` handler that aborts the `Cli` signal, and sets
  `process.exitCode = await cli.run(process.argv.slice(2))`.
- `client/package.json`: add `"bin": { "majora": "bin/majora.js" }`; extend `lint` and
  `lint_fix` to `eslint src specs bin`.
- `client/eslint.config.mjs`: make sure `bin/**/*.js` gets the Node globals / rules used for
  `src` (and allow the shebang).
- Smoke spec: spawn `node bin/majora.js --version` and `--help` with `child_process`, assert
  exit 0, the package version, and the help header. No network.
- Keep `src/index.js` unchanged: the CLI classes are internal, not part of the library's
  public exports.

## Files to Change

- `client/bin/majora.js` — new.
- `client/package.json` — `bin` field and lint scripts.
- `client/eslint.config.mjs` — cover `bin/`.
- `client/specs/cli/bin_spec.js` — new smoke spec.
