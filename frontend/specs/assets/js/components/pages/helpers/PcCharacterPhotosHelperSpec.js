import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPhotosHelper from '../../../../../../assets/js/components/pages/helpers/PcCharacterPhotosHelper.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('PcCharacterPhotosHelper', function() {
  const photos = [
    { id: 1, path: 'photos/pcs/7/a.jpg' },
    { id: 2, path: 'photos/pcs/7/b.jpg' },
  ];
  const pagination = { page: 1, pages: 2, perPage: 10 };
  const handlers = { onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop };

  describe('.render', function() {
    it('renders each photo', function() {
      const html = renderToStaticMarkup(
        PcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/pcs/7/photos', '#/games/demo/pcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).toContain('photos/pcs/7/a.jpg');
      expect(html).toContain('photos/pcs/7/b.jpg');
    });

    it('renders a back button to the parent character page', function() {
      const html = renderToStaticMarkup(
        PcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/pcs/7/photos', '#/games/demo/pcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).toContain('href="#/games/demo/pcs/7"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        PcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/pcs/7/photos', '#/games/demo/pcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).toContain('pagination');
    });

    it('renders the upload button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        PcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/pcs/7/photos', '#/games/demo/pcs/7', true, 'Aragorn', handlers,
        )
      );
      expect(html).toContain(Translator.t('pc_character_photos_page.upload'));
    });

    it('does not render the upload button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        PcCharacterPhotosHelper.render(
          photos, pagination, '#/games/demo/pcs/7/photos', '#/games/demo/pcs/7', false, 'Aragorn', handlers,
        )
      );
      expect(html).not.toContain(Translator.t('pc_character_photos_page.upload'));
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(PcCharacterPhotosHelper.renderLoading()))
        .toContain(Translator.t('pc_character_photos_page.loading'));
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(PcCharacterPhotosHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
