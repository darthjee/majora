import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePhotos from '../../../../../../../assets/js/components/resources/game/pages/GamePhotos.jsx';
import GamePhotosHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GamePhotosHelper.jsx';
import GamePhotosController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GamePhotosController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GamePhotos', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(GamePhotosController);
    stubRenderLoading(GamePhotosHelper);

    const html = renderToStaticMarkup(React.createElement(GamePhotos));

    expect(html).toContain('loading');
  });

  it('renders the upload button via GamePhotosHelper.render when the game can be edited', function() {
    stubBuildEffect(GamePhotosController);

    const handlers = { onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop };
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      GamePhotosHelper.render([], pagination, '#/games/demo/photos', '#/games/demo', true, 'Demo', handlers)
    );

    expect(html).toContain('<button');
  });
});
