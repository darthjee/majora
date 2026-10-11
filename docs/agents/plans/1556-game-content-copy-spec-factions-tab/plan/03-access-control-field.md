# Record `name_taken_in_target` in the staff copy access rules

`docs/agents/access-control/staff-copy.md` ("Fields") says source list rows expose the source
entity's fields plus `copied_to_target`. Add that the factions list rows also expose
`name_taken_in_target`, a boolean derived from the target game's faction names (staff-only, like
the rest of the list; it reveals only whether a name exists in the target, never the target
faction's id or data). Optionally mention the flag in `page.md`'s source-list rows paragraph
next to `copied_to_target` if that reads naturally; otherwise keep it in `factions.md` only.

## Files to Change

- `docs/agents/access-control/staff-copy.md` — mention the factions-only list flag.
