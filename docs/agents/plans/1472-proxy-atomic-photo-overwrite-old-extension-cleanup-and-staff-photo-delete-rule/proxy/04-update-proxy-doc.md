# Update the proxy architecture doc
Document the new behavior in `docs/agents/architecture/proxy.md`:
- atomic temp-file + rename writes in the upload flow;
- finalize handling of `previous_path` (200) and `cleanup_path` (404, finalize only);
- `DeleteHandler` serving both the character and staff delete routes.

## Files to Change
- `docs/agents/architecture/proxy.md` — upload and delete flow sections.
