import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterTreasures from '../../../../../assets/js/components/pages/PcCharacterTreasures.jsx';
import CharacterTreasuresHelper from '../../../../../assets/js/components/pages/helpers/CharacterTreasuresHelper.jsx';
import PcCharacterTreasuresController
  from '../../../../../assets/js/components/pages/controllers/PcCharacterTreasuresController.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('PcCharacterTreasures', function() {
  it('renders the loading state while fetching', function() {
    spyOn(PcCharacterTreasuresController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);
    spyOn(CharacterTreasuresHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(PcCharacterTreasures));

    expect(html).toContain('loading');
  });

  it('renders the error state via CharacterTreasuresHelper.renderError', function() {
    const html = renderToStaticMarkup(CharacterTreasuresHelper.renderError('Unable to load treasures.'));

    expect(html).toContain('Unable to load treasures.');
  });

  it('renders the treasures table via CharacterTreasuresHelper.render', function() {
    spyOn(PcCharacterTreasuresController.prototype, 'buildEffect').and.returnValue(() => Noop.noop);

    const treasures = [{ id: 1, name: 'Golden Crown', quantity: 1, value: 500 }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      CharacterTreasuresHelper.render(treasures, pagination, '#/games/demo/pcs/7/treasures', '#/games/demo/pcs/7')
    );

    expect(html).toContain('Golden Crown');
    expect(html).toContain('href="#/games/demo/pcs/7"');
  });
});
