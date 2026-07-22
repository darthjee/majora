import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterLinksShow, { buildCharacterLinksField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterLinksSlot.jsx';
import { buildLink } from '../../../../../../../../support/factories.js';

describe('CharacterLinksSlot', function() {
  describe('Show', function() {
    it('renders the character links', function() {
      const html = renderToStaticMarkup(
        React.createElement(CharacterLinksShow, {
          links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })],
        }),
      );

      expect(html).toContain('href="https://example.com/wiki"');
    });
  });

  describe('buildCharacterLinksField', function() {
    it('renders the mode-scoped "Edit links" button label', function() {
      const LinksField = buildCharacterLinksField({ edit: 'pc_edit_page.edit_links_button' });
      const html = renderToStaticMarkup(
        React.createElement(LinksField, { mode: 'edit', links: [], handlers: {} }),
      );

      expect(html).toContain('Edit links');
    });

    it('filters out links marked for deletion', function() {
      const LinksField = buildCharacterLinksField({ edit: 'pc_edit_page.edit_links_button' });
      const html = renderToStaticMarkup(
        React.createElement(LinksField, {
          mode: 'edit',
          links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki', delete: true })],
          handlers: {},
        }),
      );

      expect(html).not.toContain('href="https://example.com/wiki"');
    });
  });
});
