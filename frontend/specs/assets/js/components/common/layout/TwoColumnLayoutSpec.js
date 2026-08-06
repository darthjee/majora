import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TwoColumnLayout from '../../../../../../assets/js/components/common/layout/TwoColumnLayout.jsx';
import TwoColumnLayoutHelper from '../../../../../../assets/js/components/common/layout/helpers/TwoColumnLayoutHelper.jsx';

describe('TwoColumnLayout', function() {
  it('delegates rendering to TwoColumnLayoutHelper with the given panes', function() {
    const browsePane = React.createElement('div', null, 'browse');
    const detailPane = React.createElement('div', null, 'detail');
    spyOn(TwoColumnLayoutHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(React.createElement(TwoColumnLayout, { browsePane, detailPane }));

    expect(TwoColumnLayoutHelper.render).toHaveBeenCalledWith(browsePane, detailPane);
  });

  it('defaults detailPane to null when omitted', function() {
    const browsePane = React.createElement('div', null, 'browse');
    spyOn(TwoColumnLayoutHelper, 'render').and.returnValue(null);

    renderToStaticMarkup(React.createElement(TwoColumnLayout, { browsePane }));

    expect(TwoColumnLayoutHelper.render).toHaveBeenCalledWith(browsePane, null);
  });
});
