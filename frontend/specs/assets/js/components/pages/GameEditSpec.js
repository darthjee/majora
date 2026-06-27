import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameEdit from '../../../../../assets/js/components/pages/GameEdit.jsx';
import GameEditController from '../../../../../assets/js/components/pages/controllers/GameEditController.js';
import GameEditHelper from '../../../../../assets/js/components/pages/helpers/GameEditHelper.jsx';

describe('GameEdit', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    spyOn(GameEditController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(GameEditHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(GameEdit));

    expect(html).toContain('loading');
  });
});
