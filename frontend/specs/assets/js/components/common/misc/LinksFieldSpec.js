import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import LinksField from '../../../../../../assets/js/components/common/misc/LinksField.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import { buildLink } from '../../../../../support/factories.js';

describe('LinksField', function() {
  it('delegates rendering to LinksFieldHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(LinksField, {
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
      React.createElement(LinksField, { buttonLabel: 'Edit links', onOpenLinksModal: Noop.noop })
    )).not.toThrow();
  });
});
