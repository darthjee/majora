import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { buildCharacterSubmitButton }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterSubmitSlot.jsx';

describe('CharacterSubmitSlot', function() {
  const labelKeys = { edit: 'npc_edit_page.submit', new: 'game_npc_new_page.submit' };

  it('renders the mode-scoped submit label', function() {
    const SubmitButton = buildCharacterSubmitButton(labelKeys);
    const html = renderToStaticMarkup(React.createElement(SubmitButton, { mode: 'new', status: 'idle' }));

    expect(html).toContain('type="submit"');
    expect(html).toContain('Create NPC');
  });

  it('disables the button while submitting', function() {
    const SubmitButton = buildCharacterSubmitButton(labelKeys);
    const html = renderToStaticMarkup(
      React.createElement(SubmitButton, { mode: 'edit', status: 'submitting' }),
    );

    expect(html).toContain('disabled=""');
  });

  it('does not hide the button on photo-upload-failed status by default', function() {
    const SubmitButton = buildCharacterSubmitButton(labelKeys);
    const html = renderToStaticMarkup(
      React.createElement(SubmitButton, { mode: 'new', status: 'photo-upload-failed' }),
    );

    expect(html).toContain('type="submit"');
  });

  it('hides the button on photo-upload-failed status when configured to', function() {
    const SubmitButton = buildCharacterSubmitButton(labelKeys, true);
    const html = renderToStaticMarkup(
      React.createElement(SubmitButton, { mode: 'new', status: 'photo-upload-failed' }),
    );

    expect(html).toBe('');
  });
});
