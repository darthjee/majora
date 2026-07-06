import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PhotoUploadOverlay from '../../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('PhotoUploadOverlay', function() {
  it('does not render a secondary button by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('photo-upload-overlay-button-right');
    expect(html).toContain('photo-upload-overlay-button');
    expect(html).not.toContain('photo-upload-overlay-button-left');
  });

  it('renders the primary button with the left modifier when a secondary button is present', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
        secondaryButton: { label: 'Mark as Slain', variant: 'danger', onClick: Noop.noop },
      })
    );

    expect(html).toContain('photo-upload-overlay-button-left');
  });

  it('renders the secondary button with the right modifier and given label/variant', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
        secondaryButton: { label: 'Mark as Slain', variant: 'danger', onClick: Noop.noop },
      })
    );

    expect(html).toContain('photo-upload-overlay-button-right');
    expect(html).toContain('btn-danger');
    expect(html).toContain('Mark as Slain');
  });

  it('renders the secondary button regardless of canEdit (gating is the caller\'s responsibility)', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: false,
        onClick: Noop.noop,
        secondaryButton: { label: 'Mark as Slain', variant: 'danger', onClick: Noop.noop },
      })
    );

    expect(html).toContain('photo-upload-overlay-button-right');
    expect(html).not.toContain('photo-upload-overlay-button-left');
  });

  it('invokes the secondary button onClick when clicked', function() {
    const onSecondaryClick = jasmine.createSpy('onSecondaryClick');
    const rendered = PhotoUploadOverlay({
      url: null,
      alt: 'Epic Quest',
      canEdit: true,
      onClick: Noop.noop,
      secondaryButton: { label: 'Mark as Slain', variant: 'danger', onClick: onSecondaryClick },
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

    const secondaryButton = buttons.find((button) => button.props.className.includes('-right'));
    secondaryButton.props.onClick();

    expect(onSecondaryClick).toHaveBeenCalled();
  });
});
