# Frontend Plan: Refactor: reduce ActionsOverlay's parameter count below the complexity limit

Main plan: [plan.md](plan.md)

## Steps

- [01 — Update the ActionsOverlay component](frontend/01-update-actionsoverlay-component.md)
- [02 — Update direct JSX call sites](frontend/02-update-direct-call-sites.md)
- [03 — Update the list-page NPC action-bar config](frontend/03-update-npc-action-bar-config.md)
- [04 — Update affected specs](frontend/04-update-affected-specs.md)

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- `grayscale` and `dimmed` were picked as the grouped pair (over `canEdit`+`onClick` or `type`+`photoClassName`) because it produces the smallest diff: only 1 call site passes `grayscale` and ~14 pass `dimmed`, and most pass at most one of the two.
- `CharacterAvatarFieldHelper.render(url, alt, canEdit, onClick, dimmed)`'s own positional-argument signature is unrelated to `ActionsOverlay`'s prop shape and is out of scope — only its internal `<ActionsOverlay>` call changes.
- After Step 3, `characterListTypes.js`'s `buildNpcActionBarProps` already returns `photoState` nested, so `ListPageHelper.jsx`'s existing `{...actionBarProps}` spread onto `<ActionsOverlay>` needs no change of its own.
