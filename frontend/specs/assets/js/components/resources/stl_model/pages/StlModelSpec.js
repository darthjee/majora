import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModel from '../../../../../../../assets/js/components/resources/stl_model/pages/StlModel.jsx';
import StlModelHelper from '../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx';
import StlModelController from '../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';
import { buildStlModel } from '../../../../../../support/factories.js';

describe('StlModel', function() {
  it('renders the loading state while fetching', function() {
    stubBuildEffect(StlModelController);
    stubRenderLoading(StlModelHelper);

    const html = renderToStaticMarkup(React.createElement(StlModel));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(StlModelController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(StlModel));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(StlModelController));
  });

  it('renders the STL model name via StlModelHelper.render', function() {
    stubBuildEffect(StlModelController);

    const stlModel = buildStlModel({ id: 1, name: 'Goblin Miniature' });
    const html = renderToStaticMarkup(StlModelHelper.render(stlModel));

    expect(html).toContain('Goblin Miniature');
  });
});
