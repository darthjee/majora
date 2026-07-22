import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterNameShow, { buildCharacterNameField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterNameSlot.jsx';

describe('CharacterNameSlot', function() {
  it('renders the character name as a heading in show mode', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterNameShow, { name: 'Aragorn' }));

    expect(html).toBe('<h1>Aragorn</h1>');
  });

  describe('buildCharacterNameField', function() {
    it('always renders when alwaysShow is true, regardless of isFullEditor (NPCs)', function() {
      const NameField = buildCharacterNameField(
        { edit: { id: 'npc-edit-name', labelKey: 'npc_edit_page.name_label' } }, true,
      );
      const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
      const html = renderToStaticMarkup(
        React.createElement(NameField, {
          mode: 'edit', name: 'Grix', isFullEditor: false, handlers,
        }),
      );

      expect(html).toContain('id="npc-edit-name"');
      expect(html).toContain('value="Grix"');
    });

    it('gates on isFullEditor when alwaysShow is false (PCs)', function() {
      const NameField = buildCharacterNameField(
        { edit: { id: 'pc-edit-name', labelKey: 'pc_edit_page.name_label' } }, false,
      );
      const handlers = { onNameChange: jasmine.createSpy('onNameChange') };

      const hiddenHtml = renderToStaticMarkup(
        React.createElement(NameField, {
          mode: 'edit', name: 'Aragorn', isFullEditor: false, handlers,
        }),
      );
      const shownHtml = renderToStaticMarkup(
        React.createElement(NameField, {
          mode: 'edit', name: 'Aragorn', isFullEditor: true, handlers,
        }),
      );

      expect(hiddenHtml).toBe('');
      expect(shownHtml).toContain('id="pc-edit-name"');
    });

    it('picks the id/label variant matching the current mode', function() {
      const NameField = buildCharacterNameField(
        {
          edit: { id: 'npc-edit-name', labelKey: 'npc_edit_page.name_label' },
          new: { id: 'game-npc-new-name', labelKey: 'game_npc_new_page.name_label' },
        },
        true,
      );
      const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
      const html = renderToStaticMarkup(
        React.createElement(NameField, {
          mode: 'new', name: 'Grix', isFullEditor: true, handlers,
        }),
      );

      expect(html).toContain('id="game-npc-new-name"');
    });

    it('renders field-level errors when present', function() {
      const NameField = buildCharacterNameField(
        { edit: { id: 'npc-edit-name', labelKey: 'npc_edit_page.name_label' } }, true,
      );
      const handlers = { onNameChange: jasmine.createSpy('onNameChange') };
      const html = renderToStaticMarkup(
        React.createElement(NameField, {
          mode: 'edit', name: '', isFullEditor: true, fieldErrors: { name: ['is required'] }, handlers,
        }),
      );

      expect(html).toContain('is required');
    });
  });
});
