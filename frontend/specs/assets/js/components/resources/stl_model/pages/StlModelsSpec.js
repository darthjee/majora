import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModels from '../../../../../../../assets/js/components/resources/stl_model/pages/StlModels.jsx';
import StlModelsHelper from '../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx';
import StlModelNewModalHelper
  from '../../../../../../../assets/js/components/resources/stl_model/pages/elements/helpers/StlModelNewModalHelper.jsx';

describe('StlModels', function() {
  it('delegates rendering to StlModelsHelper.render with isStaffOrSuperUser, refreshToken, and an onNewClick handler', function() {
    const renderSpy = spyOn(StlModelsHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(StlModels));

    expect(renderSpy).toHaveBeenCalledWith(false, 0, jasmine.objectContaining({ onNewClick: jasmine.any(Function) }));
  });

  it('renders the New STL model modal initially closed', function() {
    let capturedShow;
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModels));

    expect(capturedShow).toBe(false);
  });

  it('opens the new-STL-model modal via the onNewClick handler without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelsHelper, 'render').and.callFake((isStaffOrSuperUser, refreshToken, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModels));

    expect(() => capturedHandlers.onNewClick()).not.toThrow();
  });

  it('closes/succeeds the modal without throwing', function() {
    let capturedHandlers;
    spyOn(StlModelNewModalHelper, 'render').and.callFake((show, formState, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(StlModels));

    expect(() => capturedHandlers.onClose()).not.toThrow();
  });
});
