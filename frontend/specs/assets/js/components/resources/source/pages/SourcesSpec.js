import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Sources from '../../../../../../../assets/js/components/resources/source/pages/Sources.jsx';
import SourcesHelper from '../../../../../../../assets/js/components/resources/source/pages/helpers/SourcesHelper.jsx';
import SourceNewModalHelper
  from '../../../../../../../assets/js/components/resources/source/pages/elements/helpers/SourceNewModalHelper.jsx';

describe('Sources', function() {
  it('delegates rendering to SourcesHelper.render with isStaffOrSuperUser, refreshToken, and an onNewClick handler', function() {
    const renderSpy = spyOn(SourcesHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(Sources));

    expect(renderSpy).toHaveBeenCalledWith(false, 0, jasmine.objectContaining({ onNewClick: jasmine.any(Function) }));
  });

  it('renders the New Source modal initially closed', function() {
    let capturedShow;
    spyOn(SourceNewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(Sources));

    expect(capturedShow).toBe(false);
  });

  it('opens the new-source modal via the onNewClick handler without throwing', function() {
    let capturedHandlers;
    spyOn(SourcesHelper, 'render').and.callFake((isStaffOrSuperUser, refreshToken, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(Sources));

    expect(() => capturedHandlers.onNewClick()).not.toThrow();
  });

  it('closes/succeeds the modal without throwing', function() {
    let capturedHandlers;
    spyOn(SourceNewModalHelper, 'render').and.callFake((show, formState, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(Sources));

    expect(() => capturedHandlers.onClose()).not.toThrow();
  });
});
