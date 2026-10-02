import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotosHelper from '../../../../../../../../assets/js/components/resources/staff_photo/pages/helpers/StaffPhotosHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const HANDLERS = {
  onResize: Noop.noop,
  onReplace: Noop.noop,
  onDelete: Noop.noop,
  onToggle: Noop.noop,
  onToggleAll: Noop.noop,
  onBulk: Noop.noop,
};

/**
 * @description Builds a page state fixture.
 * @param {object} overrides - State overrides.
 * @returns {object} Page state.
 */
function buildState(overrides = {}) {
  return {
    types: ['game', 'character'],
    photoType: 'character',
    photos: [{
      id: 5,
      path: '/photos/character/5.png',
      ready: true,
      replace_in_progress: false,
      owner: {
        type: 'character', id: 2, name: 'Aragorn', kind: 'pc', game: { slug: 'demo', name: 'Demo' },
      },
    }],
    pagination: { page: 1, pages: 3, perPage: 10 },
    actionError: null,
    actionInfo: null,
    versions: {},
    selectedIds: [],
    bulkJob: null,
    ...overrides,
  };
}

describe('StaffPhotosHelper', function() {
  describe('.render', function() {
    it('renders the title, tabs and photo rows', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.render(buildState(), HANDLERS));

      expect(html).toContain(Translator.t('staff_photos_page.title'));
      expect(html).toContain('href="#/staff/photos?type=game"');
      expect(html).toContain('nav-link active');
      expect(html).toContain(Translator.t('staff_photos_page.owner_column'));
      expect(html).toContain(Translator.t('staff_photos_page.actions_column'));
      expect(html).toContain('src="/photos/character/5.png"');
      expect(html).toContain('href="#/games/demo/pcs/2"');
      expect(html).toContain(Translator.t('staff_photos_page.replace'));
    });

    it('keeps the active type on the pagination links', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.render(buildState(), HANDLERS));

      expect(html).toContain('type=character');
      expect(html).toMatch(/#\/staff\/photos\?[^"]*page=2/);
    });

    it('renders the empty state when there are no photos', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.render(buildState({ photos: [] }), HANDLERS));

      expect(html).toContain(Translator.t('staff_photos_page.empty'));
      expect(html).not.toContain('<table');
    });

    it('renders the translated action error when present', function() {
      const html = renderToStaticMarkup(
        StaffPhotosHelper.render(buildState({ actionError: 'staff_photos_page.error_not_found' }), HANDLERS),
      );

      expect(html).toContain('alert-danger');
      expect(html).toContain(Translator.t('staff_photos_page.error_not_found'));
    });

    it('does not render an alert without an action error', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.render(buildState(), HANDLERS));

      expect(html).not.toContain('alert-danger');
      expect(html).not.toContain('alert-info');
    });

    it('renders the translated action info when present', function() {
      const html = renderToStaticMarkup(
        StaffPhotosHelper.render(buildState({ actionInfo: 'staff_photos_page.skip_gif' }), HANDLERS),
      );

      expect(html).toContain('alert-info');
      expect(html).toContain(Translator.t('staff_photos_page.skip_gif'));
    });

    it('renders the select column, row checkboxes, resize action and bulk bar', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.render(buildState(), HANDLERS));

      expect(html).toContain(Translator.t('staff_photos_page.select_column'));
      expect(html).toContain(`aria-label="${Translator.t('staff_photos_page.select_photo')}"`);
      expect(html).toContain(Translator.t('staff_photos_page.resize'));
      expect(html).toContain(Translator.t('staff_photos_page.select_all_page'));
      expect(html).toContain(Translator.t('staff_photos_page.bulk_selected').replace('{{count}}', 0));
    });

    it('checks the selected rows and the select-all toggle', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.render(buildState({ selectedIds: [5] }), HANDLERS));

      expect(html.match(/checked=""/g).length).toBe(2);
      expect(html).toContain(Translator.t('staff_photos_page.bulk_selected').replace('{{count}}', 1));
    });

    it('disables the checkboxes and actions while a bulk job runs', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.render(
        buildState({ selectedIds: [5], bulkJob: { action: 'delete', total: 1, done: 0 } }), HANDLERS,
      ));

      const buttons = html.match(/<button[^>]*>/g);

      expect(buttons.length).toBe(5);
      buttons.forEach((button) => expect(button).toContain('disabled=""'));
      expect(html.match(/type="checkbox"[^>]*disabled=""/g).length).toBe(2);
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.renderLoading());

      expect(html).toContain(Translator.t('staff_photos_page.loading'));
    });
  });

  describe('.renderError', function() {
    it('renders the translated error', function() {
      const html = renderToStaticMarkup(StaffPhotosHelper.renderError('staff_photos_page.error'));

      expect(html).toContain(Translator.t('staff_photos_page.error'));
    });
  });
});
