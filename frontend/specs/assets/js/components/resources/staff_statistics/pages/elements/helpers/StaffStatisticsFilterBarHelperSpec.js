import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsFilterBarHelper
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx';
import StaffStatisticsUserSelect
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsUserSelect.jsx';
import { DEFAULTS } from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsFilterBarHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.filters.${key}`);
  const baseState = {
    filters: { ...DEFAULTS },
    rangeDraft: '30d',
    customFrom: '2026-03-02',
    customTo: '2026-03-31',
    domains: [{ id: 2, domain: 'a.example' }, { id: 1, domain: 'b.example' }],
    resolvedGranularity: undefined,
  };
  let handlers;

  beforeEach(function() {
    handlers = {
      onRangeChange: jasmine.createSpy('onRangeChange'),
      onCustomDateChange: jasmine.createSpy('onCustomDateChange'),
      onChange: jasmine.createSpy('onChange'),
      onReset: jasmine.createSpy('onReset'),
    };
  });

  const build = (state = {}) => StaffStatisticsFilterBarHelper.render({ ...baseState, ...state }, handlers);
  const render = (state) => renderToStaticMarkup(build(state));

  const find = (element, predicate) => {
    if (!element || typeof element !== 'object') return null;
    if (predicate(element)) return element;

    for (const child of React.Children.toArray(element.props?.children)) {
      const found = find(child, predicate);
      if (found) return found;
    }
    return null;
  };
  const byTestId = (element, testId) => find(element, (node) => node.props?.['data-testid'] === testId);

  it('renders every control with its label', function() {
    const html = render();

    ['range', 'user', 'domain', 'audience', 'granularity', 'reset'].forEach((key) => {
      expect(html).toContain(t(key));
    });
    ['7d', '30d', '90d', '12m', 'custom'].forEach((range) => expect(html).toContain(t(`ranges.${range}`)));
    ['all', 'anonymous', 'logged_in'].forEach((audience) => expect(html).toContain(t(`audiences.${audience}`)));
  });

  it('hides the custom dates for presets', function() {
    expect(render()).not.toContain('type="date"');
  });

  it('shows the custom dates for custom', function() {
    const html = render({ rangeDraft: 'custom' });

    expect(html).toContain('data-testid="statistics-filter-from"');
    expect(html).toContain('value="2026-03-02"');
    expect(html).toContain('value="2026-03-31"');
  });

  it('lists any, every domain in order, then unknown', function() {
    const html = render();
    const order = [t('domain_any'), 'a.example', 'b.example', t('domain_unknown')].map((label) => html.indexOf(label));

    expect(order.every((index) => index >= 0)).toBeTrue();
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('value="2"');
    expect(html).toContain('value="unknown"');
  });

  it('shows plain Auto without a resolved granularity', function() {
    expect(render()).not.toContain(`${t('granularities.auto')} (`);
  });

  it('shows the resolved granularity next to Auto', function() {
    expect(render({ resolvedGranularity: 'week' }))
      .toContain(`${t('granularities.auto')} (${t('granularities.week')})`);
  });

  it('ignores an unknown resolved granularity', function() {
    expect(render({ resolvedGranularity: 'auto' })).not.toContain(`${t('granularities.auto')} (`);
  });

  it('passes the user filter to the user select', function() {
    const select = find(build({ filters: { ...DEFAULTS, user: '7' } }), (node) => node.type === StaffStatisticsUserSelect);

    expect(select.props.value).toBe('7');
    select.props.onChange(null);
    expect(handlers.onChange).toHaveBeenCalledWith('user', null);
  });

  it('wires the range select', function() {
    byTestId(build(), 'statistics-filter-range').props.onChange({ target: { value: '7d' } });

    expect(handlers.onRangeChange).toHaveBeenCalledWith('7d');
  });

  it('wires the custom date inputs', function() {
    const element = build({ rangeDraft: 'custom' });
    byTestId(element, 'statistics-filter-from').props.onChange({ target: { value: '2026-01-01' } });
    byTestId(element, 'statistics-filter-to').props.onChange({ target: { value: '2026-01-05' } });

    expect(handlers.onCustomDateChange).toHaveBeenCalledWith('from', '2026-01-01');
    expect(handlers.onCustomDateChange).toHaveBeenCalledWith('to', '2026-01-05');
  });

  it('wires the single-value selects', function() {
    const element = build();
    byTestId(element, 'statistics-filter-domain').props.onChange({ target: { value: 'unknown' } });
    byTestId(element, 'statistics-filter-audience').props.onChange({ target: { value: 'anonymous' } });
    byTestId(element, 'statistics-filter-granularity').props.onChange({ target: { value: 'day' } });

    expect(handlers.onChange).toHaveBeenCalledWith('domain', 'unknown');
    expect(handlers.onChange).toHaveBeenCalledWith('audience', 'anonymous');
    expect(handlers.onChange).toHaveBeenCalledWith('granularity', 'day');
  });

  it('wires the reset button', function() {
    byTestId(build(), 'statistics-filter-reset').props.onClick();

    expect(handlers.onReset).toHaveBeenCalled();
  });
});
