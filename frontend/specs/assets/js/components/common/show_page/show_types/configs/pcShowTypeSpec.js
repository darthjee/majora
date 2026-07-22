import pcShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/pcShowType.js';
import npcShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/npcShowType.js';
import CharacterAvatarSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx';
import CharacterPreviewSectionsSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPreviewSectionsSlot.jsx';
import CharacterPhotosPreviewSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';

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

  it('shows the treasures/items/documents previews only on the show page', function() {
    const previewEntry = pcShowType.right.find((entry) => entry.Show === CharacterPreviewSectionsSlot);

    expect(previewEntry.Edit).toBeUndefined();
  });

  it('shows the photos gallery preview only in the bottom slot on the show page', function() {
    expect(pcShowType.bottom).toEqual([{ Show: CharacterPhotosPreviewSlot }]);
  });
});
