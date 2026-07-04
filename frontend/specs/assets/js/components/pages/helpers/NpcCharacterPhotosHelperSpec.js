import { renderToStaticMarkup } from 'react-dom/server';
import NpcCharacterPhotosHelper from '../../../../../../assets/js/components/pages/helpers/NpcCharacterPhotosHelper.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';

describe('NpcCharacterPhotosHelper', function() {
  const photos = [
    { id: 1, path: 'photos/npcs/7/a.jpg' },
    { id: 2, path: 'photos/npcs/7/b.jpg' },
  ];
  const pagination = { page: 1, pages: 2, perPage: 10 };
  const handlers = { onOpenUploadModal: () => {}, onSelectPhoto: () => {} };

  describe('.render', function() {
    it('renders each photo', function() {
      const html = renderToStaticMarkup(
        NpcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/npcs/7/photos', '#/games/demo/npcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).toContain('photos/npcs/7/a.jpg');
      expect(html).toContain('photos/npcs/7/b.jpg');
    });

    it('renders a back button to the parent character page', function() {
      const html = renderToStaticMarkup(
        NpcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/npcs/7/photos', '#/games/demo/npcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).toContain('href="#/games/demo/npcs/7"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        NpcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/npcs/7/photos', '#/games/demo/npcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).toContain('pagination');
    });

    it('renders the upload button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        NpcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/npcs/7/photos', '#/games/demo/npcs/7', true, 'Aragorn', handlers,
        )
      );
      expect(html).toContain(Translator.t('photos_page.upload'));
    });

    it('does not render the upload button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        NpcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/npcs/7/photos', '#/games/demo/npcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).not.toContain(Translator.t('photos_page.upload'));
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(NpcCharacterPhotosHelper.renderLoading()))
        .toContain(Translator.t('photos_page.loading'));
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(NpcCharacterPhotosHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
