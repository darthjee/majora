import { renderToStaticMarkup } from 'react-dom/server';
import GamePhotosHelper from '../../../../../../assets/js/components/pages/helpers/GamePhotosHelper.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';

describe('GamePhotosHelper', function() {
  const photos = [
    { id: 1, path: 'photos/games/demo/a.jpg' },
    { id: 2, path: 'photos/games/demo/b.jpg' },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };
  const handlers = { onOpenUploadModal: () => {}, onSelectPhoto: () => {} };

  describe('.render', function() {
    it('renders each photo', function() {
      const html = renderToStaticMarkup(
        GamePhotosHelper.render(photos, pagination, '#/games/demo/photos', '#/games/demo', false, 'Demo', handlers)
      );
      expect(html).toContain('photos/games/demo/a.jpg');
      expect(html).toContain('photos/games/demo/b.jpg');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GamePhotosHelper.render(photos, pagination, '#/games/demo/photos', '#/games/demo', false, 'Demo', handlers)
      );
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GamePhotosHelper.render(photos, pagination, '#/games/demo/photos', '#/games/demo', false, 'Demo', handlers)
      );
      expect(html).toContain('pagination');
    });

    it('renders the upload button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GamePhotosHelper.render(photos, pagination, '#/games/demo/photos', '#/games/demo', true, 'Demo', handlers)
      );
      expect(html).toContain(Translator.t('game_photos_page.upload'));
    });

    it('does not render the upload button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        GamePhotosHelper.render(photos, pagination, '#/games/demo/photos', '#/games/demo', false, 'Demo', handlers)
      );
      expect(html).not.toContain(Translator.t('game_photos_page.upload'));
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GamePhotosHelper.renderLoading())).toContain(Translator.t('game_photos_page.loading'));
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(GamePhotosHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
