# Body reader and output writer

**`BodyReader`** resolves `--data` into a plain object, with `fs` and `stdin` injected:

- `-` reads all of stdin;
- `@<path>` reads the file;
- anything else is inline JSON.

The parsed value must be a JSON object (not an array, `null` or a scalar). Invalid JSON, a
non-object, or an unreadable file throws a usage error (exit 2) with a clear message that
never echoes file contents.

**`OutputWriter`** writes to an injected stdout:

- `object(value)`: `JSON.stringify(value, null, 2)` + newline (`get`, `create`, `update`,
  `mine`);
- `page(page, { meta })`: the `data` array (`[]` when empty), or
  `{ data, page, pages, perPage, total }` with `--meta`;
- `stream(asyncIterable)`: one compact `JSON.stringify(item)` line per item (NDJSON), nothing
  for an empty collection, consuming the iterator lazily (never prefetching).

Writes honour back-pressure (await `drain` when `write` returns `false`). An `EPIPE` error on
stdout is reported to the caller as a "closed pipe" signal so `Cli` stops quietly with exit 0.

## Files to Change

- `client/src/cli/BodyReader.js` — new.
- `client/src/cli/OutputWriter.js` — new.
- `client/specs/cli/BodyReader_spec.js` — new: inline, `@file`, `-` stdin, invalid JSON,
  array / scalar / `null` bodies, missing file.
- `client/specs/cli/OutputWriter_spec.js` — new: pretty JSON, empty list `[]`, `--meta`
  shape, NDJSON, empty stream, `EPIPE`.
- `client/specs/support/` — add a fake writable/readable stream helper if needed (e.g.
  `FakeStream.js`), shared by the CLI specs.
