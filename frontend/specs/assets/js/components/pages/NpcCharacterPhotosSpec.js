import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NpcCharacterPhotos from '../../../../../assets/js/components/pages/NpcCharacterPhotos.jsx';
import NpcCharacterPhotosHelper from '../../../../../assets/js/components/pages/helpers/NpcCharacterPhotosHelper.jsx';
import NpcCharacterPhotosController from '../../../../../assets/js/components/pages/controllers/NpcCharacterPhotosController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('NpcCharacterPhotos', function() {
  it('renders the loading state while fetching', function() {
    spyOn(NpcCharacterPhotosController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(NpcCharacterPhotosHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(NpcCharacterPhotos));

    expect(html).toContain('loading');
  });

  it('renders the upload button via NpcCharacterPhotosHelper.render when the character can be edited', function() {
    spyOn(NpcCharacterPhotosController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const handlers = { onOpenUploadModal: Noop.noop, onSelectPhoto: Noop.noop };
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      NpcCharacterPhotosHelper.render(
        [], pagination, '#/games/demo/npcs/7/photos', '#/games/demo/npcs/7', true, 'Aragorn', handlers,
      )
    );

    expect(html).toContain('<button');
  });
});
