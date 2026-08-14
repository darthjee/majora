import { renderToStaticMarkup } from 'react-dom/server';
import FactionCharactersPanelHelper
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/FactionCharactersPanelHelper.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('FactionCharactersPanelHelper', function() {
  const buildKickState = (overrides = {}) => ({
    target: null, factionName: 'The Silver Hand', submitting: false, error: '', ...overrides,
  });
  const buildKickHandlers = () => ({
    onKick: jasmine.createSpy('onKick'),
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  describe('.render', function() {
    it('renders the panel title', function() {
      const state = {
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: false, error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain(Translator.t('faction_page.characters_panel_title'));
    });

    it('renders the loading message while loading', function() {
      const state = {
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: true, error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain(Translator.t('faction_page.loading'));
    });

    it('renders the error message when present', function() {
      const state = {
        items: [],
        pagination: { page: 1, pages: 1, perPage: 24 },
        isDmOrAdmin: false,
        loading: false,
        error: 'faction_page.characters_panel_error',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain(Translator.t('faction_page.characters_panel_error'));
    });

    it('renders the empty state when there are no characters', function() {
      const state = {
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: false, error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain(Translator.t('faction_page.characters_panel_empty'));
    });

    it('renders a card per character and pagination when there are results', function() {
      const state = {
        items: [
          { id: 1, name: 'Aragorn', type: 'pc', photo_path: null },
          { id: 2, name: 'Gandalf', type: 'npc', photo_path: null },
        ],
        pagination: { page: 1, pages: 2, perPage: 24 },
        isDmOrAdmin: false,
        loading: false,
        error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain('href="#/games/demo/pcs/1"');
      expect(html).toContain('href="#/games/demo/npcs/2"');
    });

    it('builds the pagination base path from the game slug and faction id', function() {
      const state = {
        items: [{ id: 1, name: 'Aragorn', type: 'pc', photo_path: null }],
        pagination: { page: 1, pages: 2, perPage: 24 },
        isDmOrAdmin: false,
        loading: false,
        error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain('#/games/demo/factions/9?page=2');
    });

    it('renders a kick button for every row when isDmOrAdmin is true', function() {
      const state = {
        items: [{ id: 1, name: 'Aragorn', type: 'pc', photo_path: null, hidden: true }],
        pagination: { page: 1, pages: 1, perPage: 24 },
        isDmOrAdmin: true,
        loading: false,
        error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain('bi-person-x');
    });

    it('renders a kick button for a non-hidden row when isDmOrAdmin is false', function() {
      const state = {
        items: [{ id: 1, name: 'Aragorn', type: 'pc', photo_path: null, hidden: false }],
        pagination: { page: 1, pages: 1, perPage: 24 },
        isDmOrAdmin: false,
        loading: false,
        error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).toContain('bi-person-x');
    });

    it('renders the kick error alert when present', function() {
      const state = {
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: false, error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(
          state, 'demo', 9, buildKickState({ error: 'faction_exchange_modal.generic_error' }), buildKickHandlers(),
        ),
      );

      expect(html).toContain(Translator.t('faction_exchange_modal.generic_error'));
    });

    it('does not render the kick error alert when absent', function() {
      const state = {
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: false, error: '',
      };
      const html = renderToStaticMarkup(
        FactionCharactersPanelHelper.render(state, 'demo', 9, buildKickState(), buildKickHandlers()),
      );

      expect(html).not.toContain(Translator.t('faction_exchange_modal.generic_error'));
    });
  });
});
