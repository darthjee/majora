import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TaskListItem
  from '../../../../../../../../assets/js/components/resources/game/pages/elements/TaskListItem.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';
import { findElement } from '../../../../common/forms/helpers/support.js';

describe('TaskListItem', function() {
  const baseTask = {
    id: 7, short_description: 'Print minis', completed: false, category: 'printing',
    session: { id: 3, title: 'Session 3 — The Crypt' },
  };

  const buildProps = (overrides = {}) => ({
    task: baseTask, onToggle: Noop.noop, onView: Noop.noop, ...overrides,
  });

  const renderHtml = (overrides = {}) => renderToStaticMarkup(
    React.createElement(TaskListItem, buildProps(overrides)),
  );

  it('renders the short description as the checkbox label', function() {
    const html = renderHtml();

    expect(html).toContain('<label class="form-check-label" for="game-task-7">Print minis</label>');
    expect(html).toContain('id="game-task-7"');
  });

  it('uses the given id prefix for the checkbox id', function() {
    const html = renderHtml({ idPrefix: 'session-task' });

    expect(html).toContain('id="session-task-7"');
    expect(html).toContain('for="session-task-7"');
    expect(html).not.toContain('game-task-7');
  });

  it('renders an unchecked checkbox for a pending task', function() {
    expect(renderHtml()).not.toContain('checked=""');
  });

  it('renders a checked checkbox for a completed task', function() {
    expect(renderHtml({ task: { ...baseTask, completed: true } })).toContain('checked=""');
  });

  it('renders the translated category badge', function() {
    expect(renderHtml()).toContain('<span class="badge bg-secondary">Printing</span>');
  });

  it('renders the View button', function() {
    expect(renderHtml()).toContain('View</button>');
  });

  it('renders the session title by default', function() {
    expect(renderHtml()).toContain('<small class="task-session ms-2 text-muted">Session 3 — The Crypt</small>');
  });

  it('hides the session title when showSession is false', function() {
    expect(renderHtml({ showSession: false })).not.toContain('task-session');
  });

  it('renders no session title for a task without a session', function() {
    expect(renderHtml({ task: { ...baseTask, session: null } })).not.toContain('task-session');
  });

  it('calls onToggle with the task when the checkbox changes', function() {
    const onToggle = jasmine.createSpy('onToggle');
    const element = TaskListItem(buildProps({ onToggle }));
    const input = findElement(element, (node) => node.type === 'input');

    input.props.onChange();

    expect(onToggle).toHaveBeenCalledWith(baseTask);
  });

  it('calls onView with the task when the View button is clicked', function() {
    const onView = jasmine.createSpy('onView');
    const element = TaskListItem(buildProps({ onView }));
    const button = findElement(element, (node) => node.type === 'button');

    button.props.onClick();

    expect(onView).toHaveBeenCalledWith(baseTask);
  });
});
