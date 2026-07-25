import pcShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/pcShowType.js';
import npcShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/npcShowType.js';
import CharacterAvatarSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx';
import CharacterPhotosPreviewSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';

/**
 * Extract `pcShowType`/`npcShowType`'s `buildShortListSlot(...)`-built entries (the treasure/
 * item/document shortlists), identifying them by their shared factory-assigned function name
 * (a fresh closure is built per call, so they cannot be compared via `toBe` against an import).
 *
 * @param {Array<Function|object>} entries - A show type's `right` slot entries.
 * @returns {object[]} The matching `{ Show }` entries, in declaration order.
 */
function findShortListEntries(entries) {
  return entries.filter((entry) => entry.Show && entry.Show.name === 'ShortListSlot');
}

describe('pcShowType', function() {
  it('shares the avatar slot verbatim with npcShowType', function() {
    expect(pcShowType.left[0]).toBe(CharacterAvatarSlot);
    expect(npcShowType.left[0]).toBe(CharacterAvatarSlot);
  });

  it('has no `new` mode (PCs are never created through this flow), except for the avatar slot '
    + 'shared verbatim with npcShowType (harmlessly unused for pc, which has no new page)', function() {
    pcShowType.left.forEach((entry) => {
      if (typeof entry === 'function' || entry === CharacterAvatarSlot) return;
      expect(entry.New).toBeUndefined();
    });
    pcShowType.right.forEach((entry) => {
      expect(entry.New).toBeUndefined();
    });
  });

  it('only shows/edits the title in edit mode', function() {
    const titleEntry = pcShowType.right[0];

    expect(titleEntry.Show).toBeUndefined();
    expect(titleEntry.Edit).toBeDefined();
  });

  it('shows the treasures/items/documents shortlists only on the show page', function() {
    const shortListEntries = findShortListEntries(pcShowType.right);
    const resources = shortListEntries.map((entry) => entry.Show({}).props.resource);

    expect(resources).toEqual(['treasure', 'item', 'document']);
    shortListEntries.forEach((entry) => expect(entry.Edit).toBeUndefined());
  });

  it('shows the photos gallery preview only in the bottom slot on the show page', function() {
    expect(pcShowType.bottom).toEqual([{ Show: CharacterPhotosPreviewSlot }]);
  });
});
