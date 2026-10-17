# Rewrite cli.md

Rewrite `docs/agents/specs/client/cli.md` from the issue's **Solution** section, keeping the
page template.

- **Header:** keep "Refined by #1599 and implemented by #1610".
- **Overview:** replace the `majora characters list --game 3` example with a scope-family,
  slug-based one: `majora npcs list --game epic-quest`.
- **Decisions:** keep the existing four bullets (thin layer, same package, configuration,
  coverage), sharpening them where the agreed design does:
  - Configuration also covers `MAJORA_GAME` and `--token-file`.
  - Coverage lists the exact resources and actions (the #1609 plain resources), and says that
    #1621–#1623 commands are follow-up work.

  Then add one subsection per agreed topic:
  - Command grammar
  - Output
  - Flags (table), including the **no `--token`** rule and its reason
  - Exit codes and error output (table)
  - Executable and argument parsing (`majora`, `util.parseArgs`)
  - Internal layout (the `src/cli/` tree and the `bin/majora.js` shim)
  - Edge cases
  - Backward compatibility (the CLI surface is a semver contract)
  - Testing strategy
  - Performance and security

  Each subsection ends with its **Rejected:** alternatives, where the Solution names any.
- **Open questions:** replace the list with "None remain: #1599 settled them all."
- **Affected code:** keep both entries. Add `client/bin/majora.js`, `client/src/cli/` and
  `client/specs/cli/`.

## Files to Change

- `docs/agents/specs/client/cli.md`: full rewrite as described above.
