import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterPhotos from '../../../../../assets/js/components/pages/PcCharacterPhotos.jsx';
import PcCharacterPhotosHelper from '../../../../../assets/js/components/pages/helpers/PcCharacterPhotosHelper.jsx';
import PcCharacterPhotosController from '../../../../../assets/js/components/pages/controllers/PcCharacterPhotosController.js';

describe('PcCharacterPhotos', function() {
  it('renders the loading state while fetching', function() {
    spyOn(PcCharacterPhotosController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(PcCharacterPhotosHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(PcCharacterPhotos));

    expect(html).toContain('loading');
  });

  it('renders the upload button via PcCharacterPhotosHelper.render when the character can be edited', function() {
    spyOn(PcCharacterPhotosController.prototype, 'buildEffect').and.returnValue(() => () => {});

    const handlers = { onOpenUploadModal: () => {}, onSelectPhoto: () => {} };
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      PcCharacterPhotosHelper.render(
        [], pagination, '#/games/demo/pcs/7/photos', '#/games/demo/pcs/7', true, 'Aragorn', handlers,
      )
    );

    expect(html).toContain('<button');
  });
});
