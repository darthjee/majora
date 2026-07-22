import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterDmNotesShow, { buildCharacterDmNotesField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDmNotesSlot.jsx';

describe('CharacterDmNotesSlot', function() {
  describe('Show', function() {
    it('renders the private_description text', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterDmNotesShow, { private_description: 'Secretly a coward.' }),
      );

      expect(html).toContain('Secretly a coward.');
    });
  });

  describe('buildCharacterDmNotesField', function() {
    const variants = {
      edit: { id: 'npc-edit-private-description', label: 'npc_edit_page.private_description_label' },
    };

    it('renders nothing when the current editor is not a full editor', function() {
      const DmNotesField = buildCharacterDmNotesField(variants);
      const html = renderToStaticMarkup(
        React.createElement(DmNotesField, {
          mode: 'edit', privateDescription: 'DM notes.', isFullEditor: false, handlers: {},
        }),
      );

      expect(html).toBe('');
    });

    it('renders for a full editor, even on an NPC', function() {
      const DmNotesField = buildCharacterDmNotesField(variants);
      const html = renderToStaticMarkup(
        React.createElement(DmNotesField, {
          mode: 'edit', privateDescription: 'DM notes.', isFullEditor: true, handlers: {},
        }),
      );

      expect(html).toContain('id="npc-edit-private-description"');
      expect(html).toContain('>DM notes.</textarea>');
    });
  });
});
