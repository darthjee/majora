import npcShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/npcShowType.js';
import CharacterAvatarSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx';
import CharacterPublicSlainFieldSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPublicSlainFieldSlot.jsx';
import CharacterPreviewSectionsSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPreviewSectionsSlot.jsx';
import CharacterPhotosPreviewSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';

describe('npcShowType', function() {
  it('shares the avatar slot verbatim with pcShowType', function() {
    expect(npcShowType.left[0]).toBe(CharacterAvatarSlot);
  });

  it('only shows the hidden switch on the new/edit forms, never on the show page', function() {
    const hiddenEntry = npcShowType.left[1];

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.New).toBeDefined();
    expect(hiddenEntry.Edit).toBe(hiddenEntry.New);
  });

  it('shares the name/links/money fields across show, new, and edit', function() {
    const nameEntry = npcShowType.left[2];
    const linksEntry = npcShowType.left[3];
    const moneyEntry = npcShowType.left[4];

    [nameEntry, linksEntry, moneyEntry].forEach((entry) => {
      expect(entry.Show).toBeDefined();
      expect(entry.New).toBeDefined();
      expect(entry.Edit).toBe(entry.New);
    });
  });

  it('shares the title between new and edit', function() {
    const titleEntry = npcShowType.right[0];

    expect(titleEntry.Show).toBeUndefined();
    expect(titleEntry.New).toBeDefined();
    expect(titleEntry.Edit).toBe(titleEntry.New);
  });

  it('only offers the allegiance fields on new/edit, never on the show page', function() {
    const allegianceEntry = npcShowType.right.find((entry) => entry.New && entry.Edit && !entry.Show
      && entry !== npcShowType.right[0]);

    expect(allegianceEntry).toBeDefined();
  });

  it('only offers the public-slain field in edit mode (never new, a character cannot already be '
    + 'slain at creation)', function() {
    const slainEntry = npcShowType.right.find((entry) => entry.Edit === CharacterPublicSlainFieldSlot);

    expect(slainEntry.Show).toBeUndefined();
    expect(slainEntry.New).toBeUndefined();
  });

  it('shows the treasures/items/documents previews only on the show page', function() {
    const previewEntry = npcShowType.right.find((entry) => entry.Show === CharacterPreviewSectionsSlot);

    expect(previewEntry.New).toBeUndefined();
    expect(previewEntry.Edit).toBeUndefined();
  });

  it('shows the photos gallery preview only in the bottom slot on the show page', function() {
    expect(npcShowType.bottom).toEqual([{ Show: CharacterPhotosPreviewSlot }]);
  });
});
