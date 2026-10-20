# Add the DocumentPages wrapper

Create `client/src/resources/DocumentPages.js`, a `Resource` subclass for
`games/<slug>/documents/<document_id>/pages`, and expose it from `Documents`.

- Constructor `(http, paginator, documentsBasePath, documentId)`: calls
  `super(http, paginator, \`${documentsBasePath}/${encodeSegment(documentId, 'document id')}/pages\`)`
  so a blank id throws `UsageError`, before any request. Keep the document id available via a
  getter (`documentId`), like `GameResource.slug`.
- Static variant map (no `get`, so `get` throws `UsageError`):

  ```js
  static variants = {
    list: { regular: '', restricted: 'all' },
    create: { regular: '', restricted: 'all' },
    update: { regular: ':id', restricted: ':id/all' },
    trim: { regular: '', restricted: 'all' },
    bumpVersion: { regular: 'bump_version', restricted: 'bump_version/all' },
  };
  ```

- `list` / `iterate` / `create` / `update` come from `Resource` unchanged.
- `trim(keep, options = {})`: `DELETE` on `pathFor('trim', { restricted })` with body
  `{ keep }`, via `this.http.delete(path, { ...rest, body: { keep } })`; returns the parsed body.
- `bumpVersion(data, options = {})`: `PATCH` on `pathFor('bumpVersion', { restricted })`, body
  passed through as-is (`{ version, exclude_ids }`); returns the parsed body.
- JSDoc on the class (actions, variants, the missing `get` / `delete`, the `@example` from the
  issue) and on both custom methods, matching `Documents.js` / `Resource.js` style.
- In `Documents.js`, add `pages(documentId)` returning
  `new DocumentPages(this.http, this.paginator, this.basePath, documentId)`, and update its JSDoc
  (mention `pages(id)` in the action list and example).

## Files to Change

- `client/src/resources/DocumentPages.js` — new wrapper.
- `client/src/resources/Documents.js` — `pages(documentId)` accessor and JSDoc.
