# Move proxy and cache knowledge

`docs/agents/architecture/proxy.md` covers `UploadHandler` and `DeleteHandler` but not the copy
link handler. Add a `## Hard-link copies (`LinkHandler`)` section (anchor
`#link-handler`, or adjust the step 01 link to the real anchor). Base it on
`proxy/extension/lib/handlers/LinkHandler.php`, the narrowed `UploadHandler` route in
`proxy/*/rules/uploads.php`, and the spec's "Proxy link handler", "Route collision" and
"Failures" sections. Cover the staff guard, path validation of both ends, symlink rejection,
`link()`, same-inode retry, and the failure-to-`error` mapping.

Extend the `X-Cache-Clear` section with the **cross-domain** mode used by
`rules/staff_copies.php`: paths cleared in the cache root and every `domain_<hash>` folder,
header stripped. Mention the prod and dev difference in cache location.

Check `docs/agents/cache-warmer.md` and `navi/`. The staff copy endpoints set `X-Skip-Cache`
and must not be warmed. Add a line only if the doc lists excluded staff endpoints. Otherwise
leave it unchanged.

## Files to Change

- `docs/agents/architecture/proxy.md`: link handler section, cross-domain cache clear.
- `docs/agents/cache-warmer.md`: only if needed (see above).
