import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import RemovableBadge from '../../../../../../assets/js/components/common/badges/RemovableBadge.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('RemovableBadge', function() {
  const baseProps = { text: 'goblin', onRemove: Noop.noop, removeLabel: 'Remove tag' };

  it('renders the given text', function() {
    const html = renderToStaticMarkup(React.createElement(RemovableBadge, baseProps));

    expect(html).toContain('goblin');
  });

  it('renders only the remove icon when icon is omitted', function() {
    const html = renderToStaticMarkup(React.createElement(RemovableBadge, baseProps));

    expect(html.match(/<i /g).length).toBe(1);
    expect(html).toContain('bi-x-lg');
  });

  it('renders the given icon alongside the remove icon', function() {
    const html = renderToStaticMarkup(
      React.createElement(RemovableBadge, { ...baseProps, icon: 'bi-tag-fill' })
    );

    expect(html).toContain('bi-tag-fill');
    expect(html).toContain('bi-x-lg');
  });

  it('defaults to the secondary color variant', function() {
    const html = renderToStaticMarkup(React.createElement(RemovableBadge, baseProps));

    expect(html).toContain('bg-secondary');
  });

  it('applies the given color variant', function() {
    const html = renderToStaticMarkup(React.createElement(RemovableBadge, { ...baseProps, variant: 'danger' }));

    expect(html).toContain('bg-danger');
  });

  it('renders the removeLabel as the remove button aria-label', function() {
    const html = renderToStaticMarkup(React.createElement(RemovableBadge, baseProps));

    expect(html).toContain('aria-label="Remove tag"');
  });

  it('calls onRemove when the remove button is clicked', function() {
    const onRemove = jasmine.createSpy('onRemove');
    const element = RemovableBadge({ ...baseProps, onRemove });
    const button = element.props.children.find((child) => child && child.type === 'button');

    button.props.onClick();

    expect(onRemove).toHaveBeenCalled();
  });
});
