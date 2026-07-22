import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { buildCharacterHiddenField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterHiddenSlot.jsx';

describe('CharacterHiddenSlot', function() {
  const variants = {
    edit: { id: 'npc-edit-hidden', label: 'npc_edit_page.hidden_label' },
    new: { id: 'game-npc-new-hidden', label: 'game_npc_new_page.hidden_label' },
  };

  it('renders nothing when the current editor is not a full editor', function() {
    const HiddenField = buildCharacterHiddenField(variants);
    const html = renderToStaticMarkup(
      React.createElement(HiddenField, {
        mode: 'edit', hidden: false, isFullEditor: false, handlers: {},
      }),
    );

    expect(html).toBe('');
  });

  it('renders the mode-scoped id/label as a bootstrap switch for a full editor', function() {
    const HiddenField = buildCharacterHiddenField(variants);
    const handlers = { onHiddenChange: jasmine.createSpy('onHiddenChange') };
    const html = renderToStaticMarkup(
      React.createElement(HiddenField, {
        mode: 'new', hidden: false, isFullEditor: true, handlers,
      }),
    );

    expect(html).toContain('id="game-npc-new-hidden"');
    expect(html).toContain('form-switch');
    expect(html).toContain('role="switch"');
  });

  it('renders checked when hidden is true', function() {
    const HiddenField = buildCharacterHiddenField(variants);
    const handlers = { onHiddenChange: jasmine.createSpy('onHiddenChange') };
    const html = renderToStaticMarkup(
      React.createElement(HiddenField, {
        mode: 'edit', hidden: true, isFullEditor: true, handlers,
      }),
    );

    expect(html).toContain('checked=""');
  });
});
