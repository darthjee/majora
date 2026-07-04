import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Treasures from '../../../../../assets/js/components/pages/Treasures.jsx';
import TreasuresHelper from '../../../../../assets/js/components/pages/helpers/TreasuresHelper.jsx';
import TreasuresController from '../../../../../assets/js/components/pages/controllers/TreasuresController.js';

describe('Treasures', function() {
  it('renders the loading state while fetching', function() {
    spyOn(TreasuresController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(TreasuresHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(Treasures));

    expect(html).toContain('loading');
  });

  it('renders an upload button per treasure via TreasuresHelper.render when isSuperUser is true', function() {
    spyOn(TreasuresController.prototype, 'buildEffect').and.returnValue(() => () => {});

    const treasures = [{ id: 1, name: 'Golden Crown', value: 500 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      TreasuresHelper.render(treasures, pagination, true, () => {})
    );

    expect(html).toContain('photo-upload-overlay-button');
  });
});
