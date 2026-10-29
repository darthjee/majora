import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatisticsVisitDetail
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StatisticsVisitDetail.jsx';

describe('StatisticsVisitDetail', function() {
  it('renders the muted label followed by the value', function() {
    const html = renderToStaticMarkup(React.createElement(StatisticsVisitDetail, { label: 'Reason' }, 'No cookie'));

    expect(html).toBe('<div class="small text-nowrap"><span class="text-muted">Reason: </span>No cookie</div>');
  });
});
