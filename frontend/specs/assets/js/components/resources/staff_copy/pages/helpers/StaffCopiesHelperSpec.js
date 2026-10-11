import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopiesHelper from '../../../../../../../../assets/js/components/resources/staff_copy/pages/helpers/StaffCopiesHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const HANDLERS = {
  onSelectGame: Noop.noop, onToggle: Noop.noop, onToggleAll: Noop.noop, onCopy: Noop.noop,
};

/**
 * @description Builds a page state fixture.
 * @param {object} overrides - State overrides.
 * @returns {object} Page state.
 */
function buildState(overrides = {}) {
  return {
    types: ['items', 'factions'],
    games: [{ slug: 'a', name: 'Game A', domain_groups: [] }, { slug: 'b', name: 'Game B', domain_groups: ['x'] }],
    selection: { type: 'items', from: 'a', to: 'b' },
    rows: [{ id: 1, name: 'Sword' }],
    pagination: { page: 1, pages: 1, perPage: 10 },
    listError: null,
    selectedIds: [],
    ...overrides,
  };
}

const render = (overrides, handlers = HANDLERS) => renderToStaticMarkup(
  StaffCopiesHelper.render(buildState(overrides), handlers),
);

describe('StaffCopiesHelper', function() {
  describe('.render', function() {
    it('renders the title, both selectors, the tabs and the source list', function() {
      const html = render();

      expect(html).toContain(Translator.t('staff_copies_page.title'));
      expect(html).toContain(Translator.t('staff_copies_page.source_label'));
      expect(html).toContain(Translator.t('staff_copies_page.target_label'));
      expect(html).toContain('Game B (x)');
      expect(html).toContain(Translator.t('staff_copies_page.types.items'));
      expect(html).toContain('<td>Sword</td>');
    });

    it('renders the empty-types message instead of the tabs and list, keeping the selectors', function() {
      const html = render({ types: [] });

      expect(html).toContain(Translator.t('staff_copies_page.no_types'));
      expect(html).toContain(Translator.t('staff_copies_page.source_label'));
      expect(html).not.toContain('nav-tabs');
      expect(html).not.toContain('<table');
    });

    it('renders the hint until both games are selected', function() {
      const html = render({ selection: { type: 'items', from: 'a', to: '' } });

      expect(html).toContain(Translator.t('staff_copies_page.select_games_hint'));
      expect(html).not.toContain('<table');
    });

    it('renders the validation error on the same game', function() {
      const html = render({
        selection: { type: 'items', from: 'a', to: 'a' }, listError: 'staff_copies_page.same_game_error',
      });

      expect(html).toContain(Translator.t('staff_copies_page.same_game_error'));
      expect(html).not.toContain('<table');
    });

    it('forwards selector changes with their key', function() {
      const onSelectGame = jasmine.createSpy('onSelectGame');
      const tree = StaffCopiesHelper.render(buildState(), { ...HANDLERS, onSelectGame });
      const [fromSelect, toSelect] = tree.props.children[2].props.children;

      fromSelect.props.onChange('b');
      toSelect.props.onChange('a');

      expect(onSelectGame).toHaveBeenCalledWith('from', 'b');
      expect(onSelectGame).toHaveBeenCalledWith('to', 'a');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      expect(renderToStaticMarkup(StaffCopiesHelper.renderLoading())).toContain(Translator.t('staff_copies_page.loading'));
    });
  });

  describe('.renderError', function() {
    it('renders the translated error', function() {
      expect(renderToStaticMarkup(StaffCopiesHelper.renderError('staff_copies_page.error')))
        .toContain(Translator.t('staff_copies_page.error'));
    });
  });
});
