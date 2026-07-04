import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionEdit from '../../../../../assets/js/components/pages/GameSessionEdit.jsx';
import GameSessionEditController from '../../../../../assets/js/components/pages/controllers/GameSessionEditController.js';
import GameSessionEditHelper from '../../../../../assets/js/components/pages/helpers/GameSessionEditHelper.jsx';

describe('GameSessionEdit', function() {
  it('renders the loading state on initial render before the fetch resolves', function() {
    spyOn(GameSessionEditController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(GameSessionEditHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(GameSessionEdit));

    expect(html).toContain('loading');
  });
});
