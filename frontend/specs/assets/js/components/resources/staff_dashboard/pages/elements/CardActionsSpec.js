import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CardActions from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/CardActions.jsx';

describe('CardActions', function() {
  const buildActions = (overrides = {}) => [
    {
      icon: 'bi-database-fill-dash',
      tooltip: 'Clear Cache',
      onClick: jasmine.createSpy('onClick'),
      disabled: false,
      ...overrides,
    },
  ];

  it('renders one button per action, with its icon and tooltip content', function() {
    const actions = buildActions();
    const html = renderToStaticMarkup(React.createElement(CardActions, { actions }));
    const rendered = React.createElement(CardActions, { actions });
    const element = rendered.type(rendered.props);
    const tooltip = element.props.children[0];

    expect(html).toContain('bi-database-fill-dash');
    expect(tooltip.props.content).toBe('Clear Cache');
  });

  it('renders every action when there are more than one', function() {
    const actions = [
      { icon: 'bi-database-fill-dash', tooltip: 'Clear Cache', onClick: jasmine.createSpy('onClick1'), disabled: false },
      { icon: 'bi-database-fill-dash', tooltip: 'Refresh', onClick: jasmine.createSpy('onClick2'), disabled: false },
    ];
    const rendered = React.createElement(CardActions, { actions });
    const element = rendered.type(rendered.props);

    expect(element.props.children.length).toBe(2);
    expect(element.props.children[0].props.content).toBe('Clear Cache');
    expect(element.props.children[1].props.content).toBe('Refresh');
  });

  it('disables the button when the action is disabled', function() {
    const actions = buildActions({ disabled: true });
    const html = renderToStaticMarkup(React.createElement(CardActions, { actions }));

    expect(html).toContain('disabled');
  });

  it('calls onClick when the button is clicked', function() {
    const actions = buildActions();
    const rendered = React.createElement(CardActions, { actions });
    const element = rendered.type(rendered.props);
    const tooltip = element.props.children[0];
    const button = tooltip.props.children;

    button.props.onClick();

    expect(actions[0].onClick).toHaveBeenCalled();
  });
});
