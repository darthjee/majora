import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenCellsHelper
  from '../../../../../../assets/js/components/common/api_tokens/ApiTokenCellsHelper.jsx';
import InlineTooltip from '../../../../../../assets/js/components/common/api_tokens/InlineTooltip.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';

const render = (node) => renderToStaticMarkup(React.createElement(React.Fragment, null, node));

describe('ApiTokenCellsHelper', function() {
  const token = {
    id: 1,
    name: 'CI bot',
    prefix: 'ab12cd',
    scopes: ['npcs:write', 'games:read', 'npcs:read', 'documents:write'],
    games: [{ slug: 'campaign', name: 'The Campaign' }],
    expires_at: '2030-05-01T12:00:00Z',
    last_used_at: null,
    created_at: '2026-01-02T03:04:05Z',
    status: 'active',
  };

  it('renders the name', function() {
    expect(render(ApiTokenCellsHelper.renderName(token))).toContain('CI bot');
  });

  it('renders the prefix in monospace', function() {
    expect(render(ApiTokenCellsHelper.renderPrefix(token))).toBe('<code>mjr_ab12cd…</code>');
  });

  describe('.scopeText', function() {
    it('renders the family label with its actions', function() {
      expect(ApiTokenCellsHelper.scopeText({ family: 'npcs', read: true, write: true })).toBe('NPCs: read/write');
      expect(ApiTokenCellsHelper.scopeText({ family: 'documents', read: false, write: true })).toBe('Documents: write');
      expect(ApiTokenCellsHelper.scopeText({ family: 'statistics', read: true, write: false }))
        .toBe('Visitor statistics: read');
    });
  });

  describe('.renderScopes', function() {
    it('renders one badge per family, in group order', function() {
      const html = render(ApiTokenCellsHelper.renderScopes(token));
      const games = html.indexOf('Games: read');
      const npcs = html.indexOf('NPCs: read/write');
      const documents = html.indexOf('Documents: write');

      expect(games).toBeGreaterThan(-1);
      expect(npcs).toBeGreaterThan(games);
      expect(documents).toBeGreaterThan(npcs);
    });

    it('renders the statistics badge last', function() {
      const html = render(ApiTokenCellsHelper.renderScopes({ ...token, scopes: ['statistics:read', 'games:read'] }));

      expect(html).toContain('Visitor statistics: read');
      expect(html.indexOf('Games: read')).toBeLessThan(html.indexOf('Visitor statistics: read'));
    });
  });

  describe('.renderGames', function() {
    it('renders game chips', function() {
      expect(render(ApiTokenCellsHelper.renderGames(token))).toContain('The Campaign');
    });

    it('renders an "All games" badge with a tooltip when no game is selected', function() {
      const element = ApiTokenCellsHelper.renderGames({ ...token, games: [] });

      expect(element.type).toBe(InlineTooltip);
      expect(element.props.content).toBe(Translator.t('api_tokens_page.all_games_tooltip'));
      expect(render(element)).toContain('All games');
    });
  });

  describe('.renderExpires', function() {
    it('renders "Never" for a null expiry', function() {
      expect(ApiTokenCellsHelper.renderExpires({ ...token, expires_at: null })).toBe('Never');
    });

    it('renders the localized date with the full date and time in a tooltip', function() {
      const date = new Date(token.expires_at);
      const language = Translator.getLanguage();
      const element = ApiTokenCellsHelper.renderExpires(token);

      expect(element.props.content).toBe(date.toLocaleString(language));
      expect(render(element)).toContain(date.toLocaleDateString(language));
    });
  });

  describe('.renderLastUsed', function() {
    it('renders "Never used" for a null last use', function() {
      expect(ApiTokenCellsHelper.renderLastUsed(token)).toBe('Never used');
    });

    it('renders the localized date and time', function() {
      const lastUsed = '2026-02-03T04:05:06Z';

      expect(ApiTokenCellsHelper.renderLastUsed({ ...token, last_used_at: lastUsed }))
        .toBe(new Date(lastUsed).toLocaleString(Translator.getLanguage()));
    });
  });

  it('renders the localized creation date and time', function() {
    expect(ApiTokenCellsHelper.renderCreated(token))
      .toBe(new Date(token.created_at).toLocaleString(Translator.getLanguage()));
  });

  describe('.renderStatus', function() {
    it('renders the active badge', function() {
      expect(render(ApiTokenCellsHelper.renderStatus(token))).toContain('bg-success');
    });

    it('renders the expired badge', function() {
      const html = render(ApiTokenCellsHelper.renderStatus({ ...token, status: 'expired' }));

      expect(html).toContain('bg-secondary');
      expect(html).toContain('Expired');
    });
  });
});
