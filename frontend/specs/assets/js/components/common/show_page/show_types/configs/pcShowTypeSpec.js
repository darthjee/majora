import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import pcShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/pcShowType.js';
import npcShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/npcShowType.js';
import CharacterAvatarSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterAvatarSlot.jsx';
import CharacterPhotosPreviewSlot
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

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

  describe('field visibility for a non-full (regular) PC editor (issue #865)', function() {
    it('renders the name field for a non-full editor', function() {
      const NameField = pcShowType.left[1].Edit;
      const html = renderToStaticMarkup(
        React.createElement(NameField, {
          mode: 'edit', name: 'Aragorn', isFullEditor: false, handlers: { onNameChange: Noop.noop },
        }),
      );

      expect(html).toContain('id="pc-edit-name"');
    });

    it('renders the role field for a non-full editor', function() {
      const RoleField = pcShowType.right[1].Edit;
      const html = renderToStaticMarkup(
        React.createElement(RoleField, {
          mode: 'edit', role: 'Ranger', isFullEditor: false, handlers: { onRoleChange: Noop.noop },
        }),
      );

      expect(html).toContain('id="pc-edit-role"');
    });

    it('renders the money field for a non-full editor when canEditMoney is true', function() {
      const MoneyField = pcShowType.left[3].Edit;
      const html = renderToStaticMarkup(
        React.createElement(MoneyField, {
          mode: 'edit', isFullEditor: false, canEditMoney: true, money: '100', gameType: 'dnd', handlers: {},
        }),
      );

      expect(html).toContain('Edit money');
    });

    it('hides the money field for a non-full editor when canEditMoney is falsy', function() {
      const MoneyField = pcShowType.left[3].Edit;
      const html = renderToStaticMarkup(
        React.createElement(MoneyField, {
          mode: 'edit', isFullEditor: false, money: '100', gameType: 'dnd', handlers: {},
        }),
      );

      expect(html).toBe('');
    });

    it('still hides the DM notes (private_description) field for a non-full editor', function() {
      const DmNotesField = pcShowType.right[3].Edit;
      const html = renderToStaticMarkup(
        React.createElement(DmNotesField, {
          mode: 'edit', privateDescription: 'secret', isFullEditor: false, handlers: {},
        }),
      );

      expect(html).toBe('');
    });
  });
});
