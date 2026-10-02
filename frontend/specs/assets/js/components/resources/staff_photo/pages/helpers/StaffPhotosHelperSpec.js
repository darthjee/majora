import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotosHelper from '../../../../../../../../assets/js/components/resources/staff_photo/pages/helpers/StaffPhotosHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

const HANDLERS = { onReplace: Noop.noop, onDelete: Noop.noop };

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
    versions: {},
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
