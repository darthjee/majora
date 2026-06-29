import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterInfo from '../../../../../assets/js/components/elements/CharacterInfo.jsx';

describe('CharacterInfo', function() {
  it('delegates rendering to CharacterInfoHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterInfo, {
        name: 'Aragorn',
        role: 'Ranger',
        description: 'The future king.',
      })
    );
    expect(html).toContain('Aragorn');
    expect(html).toContain('Ranger');
    expect(html).toContain('The future king.');
  });
});
