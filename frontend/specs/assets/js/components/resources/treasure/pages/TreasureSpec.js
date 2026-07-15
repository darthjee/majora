import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Treasure from '../../../../../../../assets/js/components/resources/treasure/pages/Treasure.jsx';
import TreasureHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/TreasureHelper.jsx';
import TreasureController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('Treasure', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(TreasureController);
    stubRenderLoading(TreasureHelper);

    const html = renderToStaticMarkup(React.createElement(Treasure));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(TreasureController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(Treasure));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(TreasureController));
  });

  it('renders an edit link via TreasureHelper.render when the treasure can be edited', function() {
    stubBuildEffect(TreasureController);

    const treasure = {
      id: 1, name: 'Golden Crown', value: 500, can_edit: true,
    };
    const html = renderToStaticMarkup(TreasureHelper.render(treasure));

    expect(html).toContain('href="#/treasures/1/edit"');
  });
});
