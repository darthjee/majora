import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterDmNotes from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterDmNotes.jsx';

describe('CharacterDmNotes', function() {
  it('delegates rendering to CharacterDmNotesHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterDmNotes, { privateDescription: 'Secret DM notes.' })
    );
    expect(html).toContain('Secret DM notes.');
  });

  it('renders nothing when privateDescription is absent', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterDmNotes, {}));
    expect(html).toBe('');
  });
});
