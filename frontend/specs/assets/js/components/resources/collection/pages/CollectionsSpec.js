import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Collections from '../../../../../../../assets/js/components/resources/collection/pages/Collections.jsx';
import CollectionsHelper from '../../../../../../../assets/js/components/resources/collection/pages/helpers/CollectionsHelper.jsx';
import CollectionNewModalHelper
  from '../../../../../../../assets/js/components/resources/collection/pages/elements/helpers/CollectionNewModalHelper.jsx';

describe('Collections', function() {
  it('delegates rendering to CollectionsHelper.render with isStaffOrSuperUser, refreshToken, and an onNewClick handler', function() {
    const renderSpy = spyOn(CollectionsHelper, 'render').and.callThrough();

    renderToStaticMarkup(React.createElement(Collections));

    expect(renderSpy).toHaveBeenCalledWith(false, 0, jasmine.objectContaining({ onNewClick: jasmine.any(Function) }));
  });

  it('renders the New Collection modal initially closed', function() {
    let capturedShow;
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show) => {
      capturedShow = show;
      return null;
    });

    renderToStaticMarkup(React.createElement(Collections));

    expect(capturedShow).toBe(false);
  });

  it('opens the new-collection modal via the onNewClick handler without throwing', function() {
    let capturedHandlers;
    spyOn(CollectionsHelper, 'render').and.callFake((isStaffOrSuperUser, refreshToken, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(Collections));

    expect(() => capturedHandlers.onNewClick()).not.toThrow();
  });

  it('closes/succeeds the modal without throwing', function() {
    let capturedHandlers;
    spyOn(CollectionNewModalHelper, 'render').and.callFake((show, formState, handlers) => {
      capturedHandlers = handlers;
      return null;
    });

    renderToStaticMarkup(React.createElement(Collections));

    expect(() => capturedHandlers.onClose()).not.toThrow();
  });
});
