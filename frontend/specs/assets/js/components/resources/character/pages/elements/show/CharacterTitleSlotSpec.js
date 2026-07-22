import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { buildCharacterTitleField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterTitleSlot.jsx';

describe('CharacterTitleSlot', function() {
  const variants = {
    edit: { title: 'npc_edit_page.title', error: 'npc_edit_page.error' },
    new: { title: 'game_npc_new_page.title', error: 'game_npc_new_page.error' },
  };

  it('renders the mode-scoped title', function() {
    const TitleField = buildCharacterTitleField(variants);
    const html = renderToStaticMarkup(React.createElement(TitleField, { mode: 'new', status: 'idle' }));

    expect(html).toContain('New NPC');
  });

  it('renders an error alert when the last submit failed', function() {
    const TitleField = buildCharacterTitleField(variants);
    const html = renderToStaticMarkup(React.createElement(TitleField, { mode: 'edit', status: 'error' }));

    expect(html).toContain('alert');
  });

  it('renders no error alert otherwise', function() {
    const TitleField = buildCharacterTitleField(variants);
    const html = renderToStaticMarkup(React.createElement(TitleField, { mode: 'edit', status: 'idle' }));

    expect(html).not.toContain('alert');
  });

  it('renders the given extra component below the title/error, passing the full context through', function() {
    function Extra({ status }) {
      return status === 'photo-upload-failed' ? React.createElement('p', null, 'extra content') : null;
    }

    const TitleField = buildCharacterTitleField(variants, Extra);
    const html = renderToStaticMarkup(
      React.createElement(TitleField, { mode: 'new', status: 'photo-upload-failed' }),
    );

    expect(html).toContain('extra content');
  });

  it('renders nothing extra when no ExtraComponent is given', function() {
    const TitleField = buildCharacterTitleField(variants);
    const html = renderToStaticMarkup(
      React.createElement(TitleField, { mode: 'edit', status: 'idle' }),
    );

    expect(html).not.toContain('extra content');
  });
});
