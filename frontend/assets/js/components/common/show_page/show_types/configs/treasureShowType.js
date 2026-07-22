import TreasureFormTitle from '../../../../resources/treasure/pages/elements/show/TreasureFormTitle.jsx';
import TreasureNameField from '../../../../resources/treasure/pages/elements/show/TreasureNameField.jsx';
import TreasureValueFieldSlot from '../../../../resources/treasure/pages/elements/show/TreasureValueFieldSlot.jsx';
import TreasureMaxUnitsField from '../../../../resources/treasure/pages/elements/show/TreasureMaxUnitsField.jsx';
import TreasureSubmitButton from '../../../../resources/treasure/pages/elements/show/TreasureSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the game-scoped treasure `new`/`edit` pages (issue #738), backing
 * `GameTreasureNew` and `GameTreasureEdit`. There is no `show` variant: the issue's affected-pages
 * list only covers the game-scoped new/edit forms, not a game-scoped detail route — a treasure's
 * detail page is always the existing global `/#/treasures/:id` route (`Treasure`/`TreasureHelper`),
 * out of scope for this issue the same way `PlayerDetail` is (no new/edit counterpart of its own
 * to justify migrating it here). The global (non-game-scoped) `TreasureNew`/`TreasureEdit` forms
 * are also out of scope: their field sets genuinely differ (a `game_type` picker on creation, no
 * `max_units` cap on edit), so this entry is not shared with them.
 *
 * `left` has no natural content — game-scoped treasure creation/edit has always been a
 * plain single-column form, with no photo slot of its own (photo upload for treasures happens
 * from the treasures *list* page's card overlay, via the global `/treasures/:id/photo_upload.json`
 * endpoint, matching the pre-migration behavior) — mirroring `gameShowType.js`'s `new` mode,
 * which likewise has no left-side content.
 */
const treasureShowType = {
  left: [],
  right: [
    { New: TreasureFormTitle, Edit: TreasureFormTitle },
    { New: TreasureNameField, Edit: TreasureNameField },
    { New: TreasureValueFieldSlot, Edit: TreasureValueFieldSlot },
    { Edit: TreasureMaxUnitsField },
    { New: TreasureSubmitButton, Edit: TreasureSubmitButton },
  ],
  bottom: [],
};

export default treasureShowType;
