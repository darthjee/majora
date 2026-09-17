# Update direct JSX call sites

Every `<ActionsOverlay ...>` JSX usage that passes `grayscale` and/or `dimmed` directly must instead pass `photoState={{ grayscale: ..., dimmed: ... }}` (only include the keys that call site actually used — don't add the other one just to fill the object).

Confirmed call sites (re-grep `grayscale=` / `dimmed=` under `frontend/assets/js/components` before starting, in case something shifted since this plan was written):

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx` — passes both `grayscale={resolveCharacterSlain(character)}` and `dimmed={!character.is_pc && Boolean(character.hidden)}` → `photoState={{ grayscale: resolveCharacterSlain(character), dimmed: !character.is_pc && Boolean(character.hidden) }}`.
- `frontend/assets/js/components/resources/common_item/pages/elements/show/CommonItemPhoto.jsx` — two `<ActionsOverlay>` usages, each `dimmed={hidden}` → `photoState={{ dimmed: hidden }}`.
- `frontend/assets/js/components/resources/possession/pages/elements/show/PossessionPhoto.jsx` — two `<ActionsOverlay>` usages with `dimmed={hidden}` → `photoState={{ dimmed: hidden }}` (leave the third usage, which passes neither prop, untouched).
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPhoto.jsx` — two `<ActionsOverlay>` usages, each `dimmed={hidden}` → `photoState={{ dimmed: hidden }}`.
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemPhoto.jsx` — two `<ActionsOverlay>` usages, each `dimmed={hidden}` → `photoState={{ dimmed: hidden }}`.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx` — `dimmed={hidden}` → `photoState={{ dimmed: hidden }}`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarFieldHelper.jsx` — internal `<ActionsOverlay dimmed={dimmed} .../>` call → `photoState={{ dimmed }}`. Do **not** rename this helper's own `render(url, alt, canEdit, onClick, dimmed)` positional signature — only its internal `ActionsOverlay` call changes.

For each file, also check any JSDoc `@param` lines that describe a `grayscale`/`dimmed` prop being forwarded to `ActionsOverlay` specifically (not general prose mentioning "dimmed"/"grayscale" behavior, which can stay) and update only where it documents the actual prop shape passed to `ActionsOverlay`.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx` — group `grayscale`/`dimmed` into `photoState`.
- `frontend/assets/js/components/resources/common_item/pages/elements/show/CommonItemPhoto.jsx` — group `dimmed` into `photoState` at both usages.
- `frontend/assets/js/components/resources/possession/pages/elements/show/PossessionPhoto.jsx` — group `dimmed` into `photoState` at both applicable usages.
- `frontend/assets/js/components/resources/document/pages/elements/show/DocumentPhoto.jsx` — group `dimmed` into `photoState` at both usages.
- `frontend/assets/js/components/resources/item/pages/elements/show/ItemPhoto.jsx` — group `dimmed` into `photoState` at both usages.
- `frontend/assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx` — group `dimmed` into `photoState`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarFieldHelper.jsx` — group `dimmed` into `photoState` in its internal `ActionsOverlay` call only.
