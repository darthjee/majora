import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokensTable from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokensTable.jsx';
import ApiTokensTableHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokensTableHelper.jsx';

describe('ApiTokensTable', function() {
  it('delegates rendering to its helper', function() {
    spyOn(ApiTokensTableHelper, 'render').and.returnValue(React.createElement('div'));
    const handlers = {};

    renderToStaticMarkup(React.createElement(ApiTokensTable, { tokens: [], renaming: null, handlers }));

    expect(ApiTokensTableHelper.render).toHaveBeenCalledWith([], null, handlers);
  });
});
