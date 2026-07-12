import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ActionsOverlay from '../../../../../../assets/js/components/elements/ActionsOverlay.jsx';
import ActionBar from '../../../../../../assets/js/components/elements/ActionBar.jsx';
import InfoBar from '../../../../../../assets/js/components/elements/InfoBar.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

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

describe('ActionsOverlay', function() {
  it('delegates canEdit, onClick, and secondaryButtons to ActionBar', function() {
    const onClick = Noop.noop;
    const secondaryButtons = [
      { label: 'Mark as Slain', variant: 'danger', icon: 'bi-skull', onClick: Noop.noop },
    ];
    const rendered = ActionsOverlay({
      url: null,
      alt: 'Epic Quest',
      canEdit: true,
      onClick,
      secondaryButtons,
    });
    const actionBar = findElement(rendered, (child) => child.type === ActionBar);

    expect(actionBar.props.canEdit).toBe(true);
    expect(actionBar.props.onClick).toBe(onClick);
    expect(actionBar.props.secondaryButtons).toBe(secondaryButtons);
  });

  it('delegates infoBarItems to InfoBar', function() {
    const infoBarItems = [{ key: 'item', label: 'Some Info' }];
    const rendered = ActionsOverlay({
      url: null,
      alt: 'Epic Quest',
      canEdit: true,
      onClick: Noop.noop,
      infoBarItems,
    });
    const infoBar = findElement(rendered, (child) => child.type === InfoBar);

    expect(infoBar.props.items).toBe(infoBarItems);
  });

  it('defaults infoBarItems to an empty array', function() {
    const rendered = ActionsOverlay({
      url: null,
      alt: 'Epic Quest',
      canEdit: true,
      onClick: Noop.noop,
    });
    const infoBar = findElement(rendered, (child) => child.type === InfoBar);

    expect(infoBar.props.items).toEqual([]);
  });

  it('wraps the photo in an actions-overlay container', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('actions-overlay');
  });

  it('does not apply the grayscale class by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('photo-grayscale');
  });

  it('applies the grayscale class when grayscale is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionsOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
        grayscale: true,
      })
    );

    expect(html).toContain('photo-grayscale');
  });
});
