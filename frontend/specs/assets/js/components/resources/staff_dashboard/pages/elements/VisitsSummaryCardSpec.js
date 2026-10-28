import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisitsSummaryCard from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/VisitsSummaryCard.jsx';
import VisitsSummaryCardController from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/controllers/VisitsSummaryCardController.js';
import VisitsSummaryCardHelper from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/VisitsSummaryCardHelper.jsx';
import ClearStatisticsConfirmModalHelper from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearStatisticsConfirmModalHelper.jsx';
import { stubBuildEffect } from '../../../../../../../support/controllerStubs.js';

describe('VisitsSummaryCard', function() {
  beforeEach(function() {
    stubBuildEffect(VisitsSummaryCardController);
  });

  it('renders the loading state with the default day period', function() {
    spyOn(VisitsSummaryCardHelper, 'render').and.callThrough();

    const html = renderToStaticMarkup(React.createElement(VisitsSummaryCard));
    const [state] = VisitsSummaryCardHelper.render.calls.mostRecent().args;

    expect(state).toEqual({ summary: null, status: 'idle', loading: true, error: false, period: 'day' });
    expect(html).toContain('<option value="day" selected="">');
  });

  it('calls the controller when the period changes', function() {
    spyOn(VisitsSummaryCardHelper, 'render').and.returnValue(null);
    const changePeriod = spyOn(VisitsSummaryCardController.prototype, 'changePeriod');

    renderToStaticMarkup(React.createElement(VisitsSummaryCard));
    const [, handlers] = VisitsSummaryCardHelper.render.calls.mostRecent().args;
    handlers.onPeriodChange({ target: { value: 'week' } });

    expect(changePeriod).toHaveBeenCalledWith('week');
  });

  it('calls the controller refresh on reload', function() {
    spyOn(VisitsSummaryCardHelper, 'render').and.returnValue(null);
    const refresh = spyOn(VisitsSummaryCardController.prototype, 'refresh');

    renderToStaticMarkup(React.createElement(VisitsSummaryCard));
    const [, handlers] = VisitsSummaryCardHelper.render.calls.mostRecent().args;
    handlers.onRefresh();

    expect(refresh).toHaveBeenCalled();
  });

  it('opens the modal on Clear without clearing yet', function() {
    spyOn(VisitsSummaryCardHelper, 'render').and.returnValue(null);
    spyOn(ClearStatisticsConfirmModalHelper, 'render').and.returnValue(null);
    const clear = spyOn(VisitsSummaryCardController.prototype, 'clear');

    renderToStaticMarkup(React.createElement(VisitsSummaryCard));
    const [show] = ClearStatisticsConfirmModalHelper.render.calls.mostRecent().args;
    const [, handlers] = VisitsSummaryCardHelper.render.calls.mostRecent().args;
    handlers.onClear();

    expect(show).toBeFalse();
    expect(clear).not.toHaveBeenCalled();
  });

  it('clears the statistics when the modal is confirmed', function() {
    spyOn(VisitsSummaryCardHelper, 'render').and.returnValue(null);
    spyOn(ClearStatisticsConfirmModalHelper, 'render').and.returnValue(null);
    const clear = spyOn(VisitsSummaryCardController.prototype, 'clear');

    renderToStaticMarkup(React.createElement(VisitsSummaryCard));
    const [, , modalHandlers] = ClearStatisticsConfirmModalHelper.render.calls.mostRecent().args;
    modalHandlers.onConfirm();

    expect(clear).toHaveBeenCalled();
  });

  it('does not clear the statistics when the modal is cancelled', function() {
    spyOn(VisitsSummaryCardHelper, 'render').and.returnValue(null);
    spyOn(ClearStatisticsConfirmModalHelper, 'render').and.returnValue(null);
    const clear = spyOn(VisitsSummaryCardController.prototype, 'clear');

    renderToStaticMarkup(React.createElement(VisitsSummaryCard));
    const [, , modalHandlers] = ClearStatisticsConfirmModalHelper.render.calls.mostRecent().args;
    modalHandlers.onCancel();

    expect(clear).not.toHaveBeenCalled();
  });
});
