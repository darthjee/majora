import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ActionBar from '../../../../../../assets/js/components/common/ActionBar.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('ActionBar', function() {
  it('does not render a secondary button by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('actions-overlay-button-right');
    expect(html).toContain('actions-overlay-button');
    expect(html).not.toContain('actions-overlay-button-left');
  });

  it('renders the primary button with the left modifier when a secondary button is present', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canEdit: true,
        onClick: Noop.noop,
        secondaryButtons: [
          { label: 'Mark as Slain', variant: 'danger', icon: 'bi-skull', onClick: Noop.noop },
        ],
      })
    );

    expect(html).toContain('actions-overlay-button-left');
  });

  it('renders a single secondary button with the right modifier and given label/variant', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canEdit: true,
        onClick: Noop.noop,
        secondaryButtons: [
          { label: 'Mark as Slain', variant: 'danger', icon: 'bi-skull', onClick: Noop.noop },
        ],
      })
    );

    expect(html).toContain('actions-overlay-button-right"');
    expect(html).not.toContain('actions-overlay-button-right-2');
    expect(html).toContain('btn-danger');
    expect(html).toContain('bi-skull');
    expect(html).toContain('aria-label="Mark as Slain"');
    expect(html).toContain('title="Mark as Slain"');
  });

  it('renders two secondary buttons at their own position, both distinct from each other', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canEdit: true,
        onClick: Noop.noop,
        secondaryButtons: [
          { label: 'Mark as Slain', variant: 'danger', icon: 'bi-skull-fill', onClick: Noop.noop },
          { label: 'Mark as Publicly Slain', variant: 'danger', icon: 'bi-skull', onClick: Noop.noop },
        ],
      })
    );

    expect(html).toContain('actions-overlay-button-right"');
    expect(html).toContain('actions-overlay-button-right-2"');
    expect(html).toContain('aria-label="Mark as Slain"');
    expect(html).toContain('aria-label="Mark as Publicly Slain"');
  });

  it('renders the secondary buttons regardless of canEdit (gating is the caller\'s responsibility)', function() {
    const html = renderToStaticMarkup(
      React.createElement(ActionBar, {
        canEdit: false,
        onClick: Noop.noop,
        secondaryButtons: [
          { label: 'Mark as Slain', variant: 'danger', icon: 'bi-skull', onClick: Noop.noop },
        ],
      })
    );

    expect(html).toContain('actions-overlay-button-right"');
    expect(html).not.toContain('actions-overlay-button-left');
  });

  it('invokes each secondary button\'s own onClick when clicked', function() {
    const onFirstClick = jasmine.createSpy('onFirstClick');
    const onSecondClick = jasmine.createSpy('onSecondClick');
    const rendered = ActionBar({
      canEdit: true,
      onClick: Noop.noop,
      secondaryButtons: [
        { label: 'Mark as Slain', variant: 'danger', icon: 'bi-skull-fill', onClick: onFirstClick },
        { label: 'Mark as Publicly Slain', variant: 'danger', icon: 'bi-skull', onClick: onSecondClick },
      ],
    });

    const buttons = [];
    const collectButtons = (node) => {
      if (Array.isArray(node)) {
        node.forEach(collectButtons);
        return;
      }
      if (node && typeof node === 'object' && node.type === 'button') {
        buttons.push(node);
      }
    };
    collectButtons(rendered.props.children);

    const firstButton = buttons.find((button) => button.props['aria-label'] === 'Mark as Slain');
    const secondButton = buttons.find((button) => button.props['aria-label'] === 'Mark as Publicly Slain');

    firstButton.props.onClick();
    secondButton.props.onClick();

    expect(onFirstClick).toHaveBeenCalled();
    expect(onSecondClick).toHaveBeenCalled();
  });
});
