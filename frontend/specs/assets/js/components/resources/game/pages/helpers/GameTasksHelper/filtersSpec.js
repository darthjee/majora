import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTasksHelper
  from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx';
import Pagination from '../../../../../../../../../assets/js/components/common/pagination/Pagination.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import { findElement } from '../../../../../common/forms/helpers/support.js';

describe('GameTasksHelper', function() {
  const handlers = {
    onToggle: Noop.noop, onFormChange: Noop.noop, onCreate: Noop.noop, onView: Noop.noop,
  };
  const task = {
    id: 1, short_description: 'Prep encounter', long_description: '', completed: false, category: 'painting',
  };
  const buildState = (overrides = {}) => ({
    tasks: [task],
    pagination: { page: 1, pages: 3, perPage: 10 },
    basePath: '#/games/demo/tasks',
    backHref: '#/games/demo',
    formValues: { category: 'other', shortDescription: '', longDescription: '' },
    fieldErrors: {},
    ...overrides,
  });

  describe('.render filters', function() {
    it('renders the filter bar between the title and the list', function() {
      const filters = React.createElement('div', { 'data-testid': 'fake-task-filters' });
      const html = renderToStaticMarkup(GameTasksHelper.render(buildState({ filters }), handlers));
      const titleIndex = html.indexOf('</h1>');
      const filtersIndex = html.indexOf('data-testid="fake-task-filters"');
      const listIndex = html.indexOf('list-group');

      expect(filtersIndex).toBeGreaterThan(titleIndex);
      expect(listIndex).toBeGreaterThan(filtersIndex);
    });

    it('renders without a filter bar when none is given', function() {
      const html = renderToStaticMarkup(GameTasksHelper.render(buildState(), handlers));

      expect(html).toContain('Prep encounter');
    });

    it('passes the active filters to Pagination as extraParams', function() {
      const activeFilters = { category: 'painting', completed: 'false' };
      const element = GameTasksHelper.render(buildState({ activeFilters }), handlers);
      const pagination = findElement(element, (node) => node.type === Pagination);

      expect(pagination.props.extraParams).toEqual(activeFilters);
    });

    it('keeps the active filters in the pagination links', function() {
      const activeFilters = { category: 'painting', completed: 'false' };
      const html = renderToStaticMarkup(GameTasksHelper.render(buildState({ activeFilters }), handlers));

      expect(html).toContain('category=painting');
      expect(html).toContain('completed=false');
    });

    it('defaults extraParams to an empty object', function() {
      const element = GameTasksHelper.render(buildState(), handlers);
      const pagination = findElement(element, (node) => node.type === Pagination);

      expect(pagination.props.extraParams).toEqual({});
    });

    it('renders the plain empty message when no filters are active', function() {
      const html = renderToStaticMarkup(GameTasksHelper.render(buildState({ tasks: [] }), handlers));

      expect(html).toContain('No tasks yet.');
      expect(html).not.toContain('No tasks match the filters.');
    });

    it('renders the filtered empty message when filters are active', function() {
      const html = renderToStaticMarkup(
        GameTasksHelper.render(buildState({ tasks: [], activeFilters: { completed: 'true' } }), handlers),
      );

      expect(html).toContain('No tasks match the filters.');
      expect(html).not.toContain('No tasks yet.');
    });
  });
});
