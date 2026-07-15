import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterLinksField from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterLinksField.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';
import { buildLink } from '../../../../../../../support/factories.js';

describe('CharacterLinksField', function() {
  it('delegates rendering to CharacterLinksFieldHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterLinksField, {
        links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })],
        buttonLabel: 'Edit links',
        onOpenLinksModal: Noop.noop,
      })
    );
    expect(html).toContain('href="https://example.com/wiki"');
    expect(html).toContain('Wiki');
    expect(html).toContain('Edit links');
  });

  it('defaults links to an empty array', function() {
    expect(() => renderToStaticMarkup(
      React.createElement(CharacterLinksField, { buttonLabel: 'Edit links', onOpenLinksModal: Noop.noop })
    )).not.toThrow();
  });
});
