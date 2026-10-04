import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsFilterBar
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsFilterBar.jsx';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsFiltersController
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/controllers/StaffStatisticsFiltersController.js';

describe('StaffStatisticsFilterBar', function() {
  const tabPath = '#/staff/statistics/visits';
  let originalWindow;
  let captured;

  beforeEach(function() {
    originalWindow = globalThis.window;
    spyOn(StaffStatisticsFilterBarHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filter bar');
    });
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const renderAt = (hash, props = {}) => {
    globalThis.window = { location: { hash } };
    return renderToStaticMarkup(React.createElement(StaffStatisticsFilterBar, { tabPath, ...props }));
  };

  it('reads the filters from the hash', function() {
    renderAt(`${tabPath}?range=custom&from=2026-01-01&to=2026-01-31&audience=anonymous`, { resolvedGranularity: 'week' });

    expect(captured.state.filters).toEqual(jasmine.objectContaining({
      range: 'custom', from: '2026-01-01', to: '2026-01-31', audience: 'anonymous',
    }));
    expect(captured.state.rangeDraft).toBe('custom');
    expect(captured.state.customFrom).toBe('2026-01-01');
    expect(captured.state.customTo).toBe('2026-01-31');
    expect(captured.state.domains).toEqual([]);
    expect(captured.state.resolvedGranularity).toBe('week');
  });

  it('navigates when a filter changes', function() {
    renderAt(tabPath);
    captured.handlers.onChange('audience', 'logged_in');

    expect(globalThis.window.location.hash).toBe(`${tabPath}?audience=logged_in`);
  });

  it('navigates when a preset is chosen', function() {
    renderAt(tabPath);
    captured.handlers.onRangeChange('7d');

    expect(globalThis.window.location.hash).toBe(`${tabPath}?range=7d`);
  });

  it('forwards custom date changes with the pending dates', function() {
    const spy = spyOn(StaffStatisticsFiltersController.prototype, 'handleCustomDateChange');
    renderAt(`${tabPath}?range=custom&from=2026-01-01&to=2026-01-31`);
    captured.handlers.onCustomDateChange('to', '2026-02-01');

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({ range: 'custom' }), { from: '2026-01-01', to: '2026-01-31' }, 'to', '2026-02-01',
    );
  });

  it('resets to the bare tab path', function() {
    renderAt(`${tabPath}?range=7d`);
    captured.handlers.onReset();

    expect(globalThis.window.location.hash).toBe(tabPath);
  });
});
