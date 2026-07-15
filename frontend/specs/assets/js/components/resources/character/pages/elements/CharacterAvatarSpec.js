import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterAvatar from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterAvatar.jsx';
import { buildCharacter } from '../../../../../../../support/factories.js';

describe('CharacterAvatar', function() {
  const character = buildCharacter({ name: 'Aragorn' });

  it('delegates rendering to CharacterAvatarHelper', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterAvatar, { character }));
    expect(html).toContain('default_character.png');
  });

  it('renders the profile photo when provided', function() {
    const c = { ...character, profile_photo_path: 'http://example.com/avatar.png' };
    const html = renderToStaticMarkup(React.createElement(CharacterAvatar, { character: c }));
    expect(html).toContain('http://example.com/avatar.png');
  });

  it('defaults handlers to an empty object', function() {
    expect(() => renderToStaticMarkup(React.createElement(CharacterAvatar, { character }))).not.toThrow();
  });
});
