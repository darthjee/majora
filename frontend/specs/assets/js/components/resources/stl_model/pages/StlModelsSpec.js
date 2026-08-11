import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModels from '../../../../../../../assets/js/components/resources/stl_model/pages/StlModels.jsx';
import StlModelsHelper from '../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx';

describe('StlModels', function() {
  it('delegates rendering to StlModelsHelper.render with isStaffOrSuperUser', function() {
    const renderSpy = spyOn(StlModelsHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(StlModels));

    expect(renderSpy).toHaveBeenCalledWith(false);
  });
});
