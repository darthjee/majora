import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FilterActions from '../../../../../../assets/js/components/common/forms/FilterActions.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';
import { findElement } from './support.js';

describe('FilterActions', function() {
  const render = (props) => renderToStaticMarkup(
    React.createElement(FilterActions, {
      onQuery: Noop.noop, onClear: Noop.noop, testIdPrefix: 'task', ...props,
    })
  );

  it('renders the query and clear buttons with prefixed test ids', function() {
    const html = render();

    expect(html).toContain('data-testid="task-filter-query"');
    expect(html).toContain('data-testid="task-filter-clear"');
  });

  it('uses the given test id prefix', function() {
    const html = render({ testIdPrefix: 'npc' });

    expect(html).toContain('data-testid="npc-filter-query"');
    expect(html).toContain('data-testid="npc-filter-clear"');
    expect(html).not.toContain('data-testid="task-filter-query"');
  });

  it('renders the shared query and clear labels', function() {
    const html = render();

    expect(html).toContain('>Query</button>');
    expect(html).toContain('>Clear</button>');
  });

  it('renders the button classes inside col-auto wrappers', function() {
    const html = render();

    expect(html).toContain(
      '<div class="col-auto"><button type="button" class="btn btn-primary" data-testid="task-filter-query"'
    );
    expect(html).toContain(
      '<div class="col-auto"><button type="button" class="btn btn-outline-secondary" data-testid="task-filter-clear"'
    );
  });

  describe('when clicking the buttons', function() {
    let onQuery;
    let onClear;
    let element;

    const findButton = (testId) => findElement(
      element, (node) => node.type === 'button' && node.props['data-testid'] === testId
    );

    beforeEach(function() {
      onQuery = jasmine.createSpy('onQuery');
      onClear = jasmine.createSpy('onClear');
      element = FilterActions({ onQuery, onClear, testIdPrefix: 'task' });
    });

    it('calls onQuery when the query button is clicked', function() {
      findButton('task-filter-query').props.onClick();

      expect(onQuery).toHaveBeenCalled();
      expect(onClear).not.toHaveBeenCalled();
    });

    it('calls onClear when the clear button is clicked', function() {
      findButton('task-filter-clear').props.onClick();

      expect(onClear).toHaveBeenCalled();
      expect(onQuery).not.toHaveBeenCalled();
    });
  });
});
