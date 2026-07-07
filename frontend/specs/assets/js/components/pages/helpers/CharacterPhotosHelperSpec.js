import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPhotosHelper from '../../../../../../assets/js/components/pages/helpers/PcCharacterPhotosHelper.jsx';
import NpcCharacterPhotosHelper from '../../../../../../assets/js/components/pages/helpers/NpcCharacterPhotosHelper.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

const KINDS = [
  { label: 'PcCharacterPhotosHelper', Helper: PcCharacterPhotosHelper, kind: 'pcs', namespace: 'pc_character_photos_page' },
  { label: 'NpcCharacterPhotosHelper', Helper: NpcCharacterPhotosHelper, kind: 'npcs', namespace: 'npc_character_photos_page' },
];

KINDS.forEach(({ label, Helper, kind, namespace }) => {
  describe(label, function() {
    const photos = [
      { id: 1, path: `photos/${kind}/7/a.jpg` },
      { id: 2, path: `photos/${kind}/7/b.jpg` },
    ];
    const pagination = { page: 1, pages: 2, perPage: 10 };
    const handlers = { onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop };

    describe('.render', function() {
      it('renders each photo', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, false, 'Aragorn', handlers,
          )
        );
        expect(html).toContain(`photos/${kind}/7/a.jpg`);
        expect(html).toContain(`photos/${kind}/7/b.jpg`);
      });

      it('renders a back button to the parent character page', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, false, 'Aragorn', handlers,
          )
        );
        expect(html).toContain(`href="#/games/demo/${kind}/7"`);
      });

      it('renders pagination', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, false, 'Aragorn', handlers,
          )
        );
        expect(html).toContain('pagination');
      });

      it('renders the upload button when canEdit is true', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, true, 'Aragorn', handlers,
          )
        );
        expect(html).toContain(Translator.t(`${namespace}.upload`));
      });

      it('does not render the upload button when canEdit is false', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, false, 'Aragorn', handlers,
          )
        );
        expect(html).not.toContain(Translator.t(`${namespace}.upload`));
      });
    });

    describe('.renderLoading', function() {
      it('renders a loading message', function() {
        expect(renderToStaticMarkup(Helper.renderLoading()))
          .toContain(Translator.t(`${namespace}.loading`));
      });
    });

    describe('.renderError', function() {
      it('renders the error in an alert', function() {
        const html = renderToStaticMarkup(Helper.renderError('Something went wrong'));
        expect(html).toContain('Something went wrong');
        expect(html).toContain('alert');
      });
    });
  });
});
