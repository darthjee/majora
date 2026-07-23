import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CardTop from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/CardTop.jsx';

describe('CardTop', function() {
  it('renders the title and data', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardTop, {
        title: 'Memory Cache',
        data: React.createElement('span', null, '42%'),
        onDataClick: jasmine.createSpy('onDataClick'),
      })
    );

    expect(html).toContain('Memory Cache');
    expect(html).toContain('42%');
  });

  it('calls onDataClick when the data slot is clicked', function() {
    const onDataClick = jasmine.createSpy('onDataClick');
    const rendered = React.createElement(CardTop, {
      title: 'Memory Cache',
      data: React.createElement('span', null, '42%'),
      onDataClick,
    });
    const element = rendered.type(rendered.props);
    const button = element.props.children[1];

    button.props.onClick();

    expect(onDataClick).toHaveBeenCalled();
  });
});
