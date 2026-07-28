import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { buildCharacterIncognitoField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterIncognitoSlot.jsx';

describe('CharacterIncognitoSlot', function() {
  const variants = {
    edit: { id: 'npc-edit-incognito', label: 'npc_edit_page.incognito_label' },
    new: { id: 'game-npc-new-incognito', label: 'game_npc_new_page.incognito_label' },
  };

  it('renders nothing when the current editor is not a full editor', function() {
    const IncognitoField = buildCharacterIncognitoField(variants);
    const html = renderToStaticMarkup(
      React.createElement(IncognitoField, {
        mode: 'edit', incognito: false, isFullEditor: false, handlers: {},
      }),
    );

    expect(html).toBe('');
  });

  it('renders the mode-scoped id/label as a bootstrap switch for a full editor', function() {
    const IncognitoField = buildCharacterIncognitoField(variants);
    const handlers = { onIncognitoChange: jasmine.createSpy('onIncognitoChange') };
    const html = renderToStaticMarkup(
      React.createElement(IncognitoField, {
        mode: 'new', incognito: false, isFullEditor: true, handlers,
      }),
    );

    expect(html).toContain('id="game-npc-new-incognito"');
    expect(html).toContain('form-switch');
    expect(html).toContain('role="switch"');
  });

  it('renders checked when incognito is true', function() {
    const IncognitoField = buildCharacterIncognitoField(variants);
    const handlers = { onIncognitoChange: jasmine.createSpy('onIncognitoChange') };
    const html = renderToStaticMarkup(
      React.createElement(IncognitoField, {
        mode: 'edit', incognito: true, isFullEditor: true, handlers,
      }),
    );

    expect(html).toContain('checked=""');
  });
});
