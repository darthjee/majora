import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenSecretView from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenSecretView.jsx';
import ApiTokenSecretViewHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenSecretViewHelper.jsx';

describe('ApiTokenSecretView', function() {
  it('delegates rendering to its helper', function() {
    spyOn(ApiTokenSecretViewHelper, 'render').and.returnValue(React.createElement('div'));
    const onCopy = jasmine.createSpy('onCopy');
    const onDone = jasmine.createSpy('onDone');

    renderToStaticMarkup(React.createElement(ApiTokenSecretView, {
      token: 'mjr_secret', copyStatus: null, onCopy, onDone,
    }));

    expect(ApiTokenSecretViewHelper.render).toHaveBeenCalledWith(
      { token: 'mjr_secret', copyStatus: null }, { onCopy, onDone },
    );
  });
});
