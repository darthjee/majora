import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterDescription from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterDescription.jsx';

describe('CharacterDescription', function() {
  it('delegates rendering to CharacterDescriptionHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterDescription, { description: 'The future king.' })
    );
    expect(html).toContain('The future king.');
  });

  it('renders nothing when description is absent', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterDescription, {}));
    expect(html).toBe('');
  });
});
