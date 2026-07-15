import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPhotos from '../../../../../../../assets/js/components/resources/character/pages/PcCharacterPhotos.jsx';
import NpcCharacterPhotos from '../../../../../../../assets/js/components/resources/character/pages/NpcCharacterPhotos.jsx';
import PcCharacterPhotosHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/PcCharacterPhotosHelper.jsx';
import NpcCharacterPhotosHelper from '../../../../../../../assets/js/components/resources/character/pages/helpers/NpcCharacterPhotosHelper.jsx';
import PcCharacterPhotosController from '../../../../../../../assets/js/components/resources/character/pages/controllers/PcCharacterPhotosController.js';
import NpcCharacterPhotosController from '../../../../../../../assets/js/components/resources/character/pages/controllers/NpcCharacterPhotosController.js';
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

      const handlers = { onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop, onSetProfilePhoto: Noop.noop };
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(
        Helper.render(
          [], pagination, `#/games/demo/${characterKind}/7/photos`, `#/games/demo/${characterKind}/7`,
          true, 'Aragorn', null, handlers,
        )
      );

      expect(html).toContain('<button');
    });

    it('renders the mark-as-profile action bar button via the helper render for a non-profile photo', function() {
      stubBuildEffect(Controller);

      const photos = [{ id: 1, path: `photos/${characterKind}/7/a.jpg` }];
      const handlers = { onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop, onSetProfilePhoto: Noop.noop };
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(
        Helper.render(
          photos, pagination, `#/games/demo/${characterKind}/7/photos`, `#/games/demo/${characterKind}/7`,
          true, 'Aragorn', 999, handlers,
        )
      );

      expect(html).toContain('bi-postage-fill');
    });
  });
});
