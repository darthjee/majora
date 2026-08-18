import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPhotosHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/PcCharacterPhotosHelper.jsx';
import NpcCharacterPhotosHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/NpcCharacterPhotosHelper.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

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
    const handlers = {
      onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop, onSetProfilePhoto: Noop.noop, onDelete: Noop.noop,
    };
    const buildPermissions = (overrides = {}) => ({
      canUploadPhoto: false, canSetProfilePhoto: false, canDeletePhoto: false, ...overrides,
    });

    describe('.render', function() {
      it('renders each photo', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, buildPermissions(),
            'Aragorn', null, handlers,
          )
        );
        expect(html).toContain(`photos/${kind}/7/a.jpg`);
        expect(html).toContain(`photos/${kind}/7/b.jpg`);
      });

      it('renders a back button to the parent character page', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, buildPermissions(),
            'Aragorn', null, handlers,
          )
        );
        expect(html).toContain(`href="#/games/demo/${kind}/7"`);
      });

      it('renders pagination', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, buildPermissions(),
            'Aragorn', null, handlers,
          )
        );
        expect(html).toContain('pagination');
      });

      it('renders the upload button when canUploadPhoto is true', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`,
            buildPermissions({ canUploadPhoto: true }), 'Aragorn', null, handlers,
          )
        );
        expect(html).toContain('bi-camera-fill');
        expect(html).toContain(`aria-label="${Translator.t(`${namespace}.upload`)}"`);
        expect(html).toContain(`title="${Translator.t(`${namespace}.upload`)}"`);
      });

      it('does not render the upload button when canUploadPhoto is false', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, buildPermissions(),
            'Aragorn', null, handlers,
          )
        );
        expect(html).not.toContain('bi-camera-fill');
      });

      it('renders the upload button when canUploadPhoto is true even without canSetProfilePhoto', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`,
            buildPermissions({ canUploadPhoto: true }), 'Aragorn', null, handlers,
          )
        );
        expect(html).toContain('bi-camera-fill');
        expect(html).not.toContain('bi-postage-fill');
      });

      it('renders the mark-as-profile action bar button when canSetProfilePhoto is true even without canUploadPhoto', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`,
            buildPermissions({ canSetProfilePhoto: true }), 'Aragorn', 1, handlers,
          )
        );
        expect(html).not.toContain('bi-camera-fill');
        expect((html.match(/bi-postage-fill/g) || []).length).toBe(1);
      });

      it('renders the mark-as-profile action bar button for non-profile photos when canSetProfilePhoto is true', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`,
            buildPermissions({ canUploadPhoto: true, canSetProfilePhoto: true }), 'Aragorn', 1, handlers,
          )
        );
        expect((html.match(/bi-postage-fill/g) || []).length).toBe(1);
      });

      it('does not render the mark-as-profile action bar button when canSetProfilePhoto is false', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, buildPermissions(),
            'Aragorn', null, handlers,
          )
        );
        expect(html).not.toContain('bi-postage-fill');
      });

      it('renders the delete action bar button for every photo when canDeletePhoto is true', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`,
            buildPermissions({ canDeletePhoto: true }), 'Aragorn', null, handlers,
          )
        );
        expect((html.match(/bi-trash-fill/g) || []).length).toBe(photos.length);
      });

      it('does not render the delete action bar button when canDeletePhoto is false', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            photos, pagination, `#/games/demo/${kind}/7/photos`, `#/games/demo/${kind}/7`, buildPermissions(),
            'Aragorn', null, handlers,
          )
        );
        expect(html).not.toContain('bi-trash-fill');
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
