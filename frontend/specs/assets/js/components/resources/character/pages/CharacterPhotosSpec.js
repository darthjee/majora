import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPhotos from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterPhotos.jsx';
import NpcCharacterPhotos from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterPhotos.jsx';
import CharacterPhotos from '../../../../../../../assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx';
import PcCharacterPhotosHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/PcCharacterPhotosHelper.jsx';
import NpcCharacterPhotosHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/NpcCharacterPhotosHelper.jsx';
import PcCharacterPhotosController from '../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterPhotosController.js';
import NpcCharacterPhotosController from '../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterPhotosController.js';
import PhotoViewModalHelper from '../../../../../../../assets/js/components/common/modals/helpers/PhotoViewModalHelper.jsx';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

const KINDS = [
  {
    label: 'PcCharacterPhotos',
    Component: PcCharacterPhotos,
    Controller: PcCharacterPhotosController,
    Helper: PcCharacterPhotosHelper,
    characterKind: 'pcs',
  },
  {
    label: 'NpcCharacterPhotos',
    Component: NpcCharacterPhotos,
    Controller: NpcCharacterPhotosController,
    Helper: NpcCharacterPhotosHelper,
    characterKind: 'npcs',
  },
];

KINDS.forEach(({ label, Component, Controller, Helper, characterKind }) => {
  describe(label, function() {
    it('renders the loading state while fetching', function() {
      stubBuildEffect(Controller);
      stubRenderLoading(Helper);

      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain('loading');
    });

    it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
      stubBuildEffect(Controller);
      spyOn(FacadeRefresh, 'useFacadeRefresh');

      renderToStaticMarkup(React.createElement(Component));

      expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(Controller));
    });

    it('renders the upload button via the helper render when the character can be edited', function() {
      stubBuildEffect(Controller);

      const handlers = {
        onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop, onSetProfilePhoto: Noop.noop, onDelete: Noop.noop,
      };
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(
        Helper.render(
          [], pagination, `#/games/demo/${characterKind}/7/photos`, `#/games/demo/${characterKind}/7`,
          true, true, false, 'Aragorn', null, handlers,
        )
      );

      expect(html).toContain('<button');
    });

    it('renders the mark-as-profile action bar button via the helper render for a non-profile photo', function() {
      stubBuildEffect(Controller);

      const photos = [{ id: 1, path: `photos/${characterKind}/7/a.jpg` }];
      const handlers = {
        onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop, onSetProfilePhoto: Noop.noop, onDelete: Noop.noop,
      };
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(
        Helper.render(
          photos, pagination, `#/games/demo/${characterKind}/7/photos`, `#/games/demo/${characterKind}/7`,
          true, true, false, 'Aragorn', 999, handlers,
        )
      );

      expect(html).toContain('bi-postage-fill');
    });

    it('renders the delete action bar button via the helper render when canDeletePhoto is true', function() {
      stubBuildEffect(Controller);

      const photos = [{ id: 1, path: `photos/${characterKind}/7/a.jpg` }];
      const handlers = {
        onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop, onSetProfilePhoto: Noop.noop, onDelete: Noop.noop,
      };
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(
        Helper.render(
          photos, pagination, `#/games/demo/${characterKind}/7/photos`, `#/games/demo/${characterKind}/7`,
          false, false, true, 'Aragorn', null, handlers,
        )
      );

      expect(html).toContain('bi-trash-fill');
    });

    it(
      'derives canSetProfilePhoto for PhotosHelper.render and PhotoViewModal from ' +
        'character.can_set_profile_photo, not can_edit',
      function() {
        // Sets photos/character/loading state synchronously during render (in the useMemo
        // factory), so the "loaded" branch of CharacterPhotos is reachable via
        // renderToStaticMarkup even though useEffect never runs during SSR.
        class LoadedController {
          constructor(setPhotos, setPagination, setCharacter, setLoading) {
            setPhotos([]);
            setPagination({ page: 1, pages: 1, perPage: 10 });
            setCharacter({ id: 7, name: 'Aragorn', can_edit: false, can_set_profile_photo: true });
            setLoading(false);
          }

          buildEffect() { return () => Noop.noop; }
        }

        let capturedCanSetProfilePhoto;
        spyOn(Helper, 'render').and.callFake((photos, pagination, basePath, backHref, canUploadPhoto, canSetProfilePhoto) => {
          capturedCanSetProfilePhoto = canSetProfilePhoto;
          return null;
        });
        let capturedModalCanSetProfilePhoto;
        spyOn(PhotoViewModalHelper, 'render').and.callFake((show, photo, alt, onClose, canSetProfilePhoto) => {
          capturedModalCanSetProfilePhoto = canSetProfilePhoto;
          return null;
        });

        renderToStaticMarkup(
          React.createElement(CharacterPhotos, {
            ControllerClass: LoadedController,
            getParamsFromHash: () => ({ game_slug: 'demo', character_id: '7' }),
            PhotosHelper: Helper,
            characterKind,
          })
        );

        expect(capturedCanSetProfilePhoto).toBe(true);
        expect(capturedModalCanSetProfilePhoto).toBe(true);
      }
    );

    it(
      'derives canDeletePhoto for PhotosHelper.render and PhotoViewModal from character.can_delete_photo',
      function() {
        class LoadedController {
          constructor(setPhotos, setPagination, setCharacter, setLoading) {
            setPhotos([]);
            setPagination({ page: 1, pages: 1, perPage: 10 });
            setCharacter({ id: 7, name: 'Aragorn', can_edit: false, can_delete_photo: true });
            setLoading(false);
          }

          buildEffect() { return () => Noop.noop; }
        }

        let capturedCanDeletePhoto;
        let capturedOnDelete;
        spyOn(Helper, 'render').and.callFake((
          photos, pagination, basePath, backHref, canUploadPhoto, canSetProfilePhoto, canDeletePhoto, alt,
          profilePhotoId, handlers,
        ) => {
          capturedCanDeletePhoto = canDeletePhoto;
          capturedOnDelete = handlers.onDelete;
          return null;
        });
        let capturedModalCanDelete;
        spyOn(PhotoViewModalHelper, 'render').and.callFake((
          show, photo, alt, onClose, canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto, canDelete,
        ) => {
          capturedModalCanDelete = canDelete;
          return null;
        });

        renderToStaticMarkup(
          React.createElement(CharacterPhotos, {
            ControllerClass: LoadedController,
            getParamsFromHash: () => ({ game_slug: 'demo', character_id: '7' }),
            PhotosHelper: Helper,
            characterKind,
          })
        );

        expect(capturedCanDeletePhoto).toBe(true);
        expect(capturedModalCanDelete).toBe(true);
        expect(capturedOnDelete).toEqual(jasmine.any(Function));
      }
    );
  });
});
