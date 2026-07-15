import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterAvatarField from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterAvatarField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterAvatarField', function() {
  it('delegates rendering to CharacterAvatarFieldHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterAvatarField, { alt: 'Aragorn', onClick: Noop.noop })
    );
    expect(html).toContain('default_character.png');
    expect(html).toContain('actions-overlay-button');
  });

  it('renders the given url when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterAvatarField, { url: 'http://example.com/avatar.png', alt: 'Aragorn' })
    );
    expect(html).toContain('http://example.com/avatar.png');
  });

  it('defaults canEdit to true', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterAvatarField, { alt: 'Aragorn' }));
    expect(html).toContain('actions-overlay-button');
  });

  it('renders no upload button when canEdit is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterAvatarField, { alt: 'Aragorn', canEdit: false })
    );
    expect(html).not.toContain('actions-overlay-button');
  });
});
