# Issue Enhancement

A checklist of concerns to consider when fleshing out a vague issue idea (tagged `Idea`/`Writting`) before it reaches the `Created` stage. Not exhaustive — adjust or extend the list for this project's needs.

- **Scope boundaries** — what's explicitly in scope and what's explicitly out.
- **Alternative solutions** — other ways to solve the same problem, and why this one was chosen.
- **Edge cases** — inputs, states, or timing the happy path doesn't cover.
- **Backward compatibility** — whether this breaks existing behavior, data, or integrations.
- **Permissions** — who can access or act on the feature, and how that access
  is resolved. For reads, endpoint-variant selection (regular vs.
  restricted/permission-gated) must go through `RequestStore`'s
  permission-resolver auto-pick mechanism (`RequestPermissionResolvers.js`)
  rather than calling `AccessStore` directly, unless there is a documented
  reason to bypass it. For mutations, an explicit `variantName` derived from
  an already-resolved permissions check (see `RequestStore.mutate`'s
  `variantName` param) is the established exception, to avoid a stale
  re-check picking a different variant than the payload was built for — but
  that already-resolved check should still come from the same
  `RequestStore`/`RequestPermissionResolvers` read path, not a redundant
  direct `AccessStore` call.
- **Testing strategy** — how the change will be verified.
- **Performance & security considerations** — anything relevant to load, latency, or attack surface.
