# Update library.md hand-offs

`library.md` defers two things to #1599. Point them at the settled design so the two pages do
not drift.

- In the **Module layout** tree, expand `cli/  # internal layout settled by #1599` into the
  settled `src/cli/` files (`Cli.js`, `ArgumentParser.js`, `CommandRegistry.js`,
  `BodyReader.js`, `OutputWriter.js`, `ExitCodes.js`, `HelpText.js`), or keep a single line and
  link to [CLI](cli.md#internal-layout-srccli). Prefer the link, so the layout lives in one
  place.
- Reword the bullet "Its internal layout belongs to #1599" to point at `cli.md`'s internal
  layout section.
- Under **Open questions**, replace the "Hand-off to #1599: ..." paragraph with a line saying
  #1599 picked it up (the slug example and the scope-family resource names are now in
  `cli.md`).

## Files to Change

- `docs/agents/specs/client/library.md`: module-layout comment, the `src/cli/` bullet and the
  hand-off note.
