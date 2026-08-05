import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import GameLinksShow, { buildGameLinksField }
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameLinksSlot.jsx';
import { buildLink } from '../../../../../../../../support/factories.js';

describe('GameLinksSlot', function() {
  describe('GameLinksShow', function() {
    it('renders the game links', function() {
      const html = renderToStaticMarkup(
        React.createElement(GameLinksShow, {
          links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })],
        }),
      );

      expect(html).toContain('href="https://example.com/wiki"');
    });
  });

  describe('buildGameLinksField', function() {
    it('renders the "Edit links" button label', function() {
      const LinksField = buildGameLinksField('game_edit_page.edit_links_button');
      const html = renderToStaticMarkup(
        React.createElement(LinksField, { links: [], handlers: {} }),
      );

      expect(html).toContain('Edit links');
    });

    it('filters out links marked for deletion', function() {
      const LinksField = buildGameLinksField('game_edit_page.edit_links_button');
      const html = renderToStaticMarkup(
        React.createElement(LinksField, {
          links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki', delete: true })],
          handlers: {},
        }),
      );

      expect(html).not.toContain('href="https://example.com/wiki"');
    });
  });
});
