import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsUserSelectHelper
  from '../../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsUserSelectHelper.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffStatisticsUserSelectHelper', function() {
  const t = (key) => Translator.t(`staff_statistics_page.filters.${key}`);
  const baseState = {
    id: 'user-input', value: null, selected: null, searchTerm: '', results: [], searched: false,
  };
  let handlers;

  beforeEach(function() {
    handlers = {
      onSearchChange: jasmine.createSpy('onSearchChange'),
      onSelect: jasmine.createSpy('onSelect'),
      onClear: jasmine.createSpy('onClear'),
    };
  });

  const render = (state) => renderToStaticMarkup(
    StaffStatisticsUserSelectHelper.render({ ...baseState, ...state }, handlers),
  );

  const findByTestId = (element, testId) => {
    if (!element || typeof element !== 'object') return null;
    if (element.props?.['data-testid'] === testId) return element;

    const children = React.Children.toArray(element.props?.children);
    for (const child of children) {
      const found = findByTestId(child, testId);
      if (found) return found;
    }
    return null;
  };

  it('renders the search input when no user is selected', function() {
    const html = render({});

    expect(html).toContain('data-testid="statistics-user-search"');
    expect(html).toContain(`placeholder="${t('user_search_placeholder')}"`);
    expect(html).toContain('id="user-input"');
    expect(html).not.toContain('statistics-user-results');
  });

  it('renders no results before the search completes', function() {
    expect(render({ searchTerm: 'ja', searched: false })).not.toContain('statistics-user-results');
  });

  it('renders the results with name and email', function() {
    const html = render({
      searchTerm: 'ja', searched: true, results: [{ id: 1, name: 'jane', email: 'jane@example.com' }],
    });

    expect(html).toContain('jane');
    expect(html).toContain('jane@example.com');
  });

  it('renders the no-results row', function() {
    expect(render({ searchTerm: 'zz', searched: true })).toContain(t('user_no_results'));
  });

  it('renders the selected user name with a clear button', function() {
    const html = render({ value: '5', selected: { id: '5', name: 'jane', deleted: false } });

    expect(html).toContain('jane');
    expect(html).toContain(t('user_clear'));
    expect(html).not.toContain('statistics-user-search');
  });

  it('renders the id while the label is loading', function() {
    const html = render({ value: '5', selected: null });

    expect(html).toContain('#5');
    expect(html).not.toContain('statistics-user-deleted');
  });

  it('renders the id with the deleted hint', function() {
    const html = render({ value: '5', selected: { id: '5', name: null, deleted: true } });

    expect(html).toContain('#5');
    expect(html).toContain(t('user_deleted'));
  });

  it('wires the search input change', function() {
    const input = findByTestId(StaffStatisticsUserSelectHelper.render(baseState, handlers), 'statistics-user-search');
    input.props.onChange({ target: { value: 'jo' } });

    expect(handlers.onSearchChange).toHaveBeenCalledWith('jo');
  });

  it('wires the result click', function() {
    const user = { id: 1, name: 'jane', email: 'jane@example.com' };
    const element = StaffStatisticsUserSelectHelper.render(
      { ...baseState, searchTerm: 'ja', searched: true, results: [user] }, handlers,
    );
    const list = findByTestId(element, 'statistics-user-results');
    React.Children.toArray(list.props.children)[0].props.onClick();

    expect(handlers.onSelect).toHaveBeenCalledWith(user);
  });

  it('wires the clear button', function() {
    const element = StaffStatisticsUserSelectHelper.render({ ...baseState, value: '5' }, handlers);
    findByTestId(element, 'statistics-user-clear').props.onClick();

    expect(handlers.onClear).toHaveBeenCalled();
  });
});
