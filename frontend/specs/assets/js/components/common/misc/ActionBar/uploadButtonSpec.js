import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ActionBar from '../../../../../../../assets/js/components/common/misc/ActionBar.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('ActionBar', function() {
  it('renders the upload button when canEdit is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('actions-overlay-button');
    expect(html).toContain('bi-camera-fill');
    expect(html).toContain('aria-label="Upload Photo"');
    expect(html).toContain('title="Upload Photo"');
  });

  it('does not render the upload button when canEdit is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canEdit: false,
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('actions-overlay-button');
    expect(html).not.toContain('<button');
  });

  it('does not render the upload button when canEdit is absent', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('<button');
  });

  it('invokes onClick when the upload button is clicked', function() {
    const onClick = jasmine.createSpy('onClick');
    const rendered = ActionBar({
      canEdit: true,
      onClick,
    });

    const button = findElement(rendered, (child) => child.type === 'button');
    button.props.onClick();

    expect(onClick).toHaveBeenCalled();
  });
});
