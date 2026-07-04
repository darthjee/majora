import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePhotos from '../../../../../assets/js/components/pages/GamePhotos.jsx';
import GamePhotosHelper from '../../../../../assets/js/components/pages/helpers/GamePhotosHelper.jsx';
import GamePhotosController from '../../../../../assets/js/components/pages/controllers/GamePhotosController.js';

describe('GamePhotos', function() {
  it('renders the loading state while fetching', function() {
    spyOn(GamePhotosController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(GamePhotosHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(GamePhotos));

    expect(html).toContain('loading');
  });

  it('renders the upload button via GamePhotosHelper.render when the game can be edited', function() {
    spyOn(GamePhotosController.prototype, 'buildEffect').and.returnValue(() => () => {});

    const handlers = { onOpenUploadModal: () => {}, onSelectPhoto: () => {} };
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      GamePhotosHelper.render([], pagination, '#/games/demo/photos', '#/games/demo', true, 'Demo', handlers)
    );

    expect(html).toContain('<button');
  });
});
