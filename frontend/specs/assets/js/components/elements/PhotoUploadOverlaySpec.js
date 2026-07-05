import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PhotoUploadOverlay from '../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';
import Noop from '../../../../../assets/js/utils/Noop.js';

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

describe('PhotoUploadOverlay', function() {
  it('renders a CardPhoto by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: 'http://example.com/photo.png',
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('card-photo-square');
    expect(html).toContain('http://example.com/photo.png');
  });

  it('renders a CardTreasureImage when type is treasure', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        type: 'treasure',
        url: null,
        alt: 'Golden Crown',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('default_treasure.png');
  });

  it('renders a CardAvatar when type is avatar', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        type: 'avatar',
        url: null,
        alt: 'Aragorn',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('default_character.png');
  });

  it('wraps the photo in a photo-upload-overlay container', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('photo-upload-overlay');
  });

  it('renders the upload button when canEdit is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
      })
    );

    expect(html).toContain('photo-upload-overlay-button');
    expect(html).toContain('Upload Photo');
  });

  it('does not render the upload button when canEdit is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: false,
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('photo-upload-overlay-button');
    expect(html).not.toContain('<button');
  });

  it('does not render the upload button when canEdit is absent', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        onClick: Noop.noop,
      })
    );

    expect(html).not.toContain('<button');
  });

  it('invokes onClick when the upload button is clicked', function() {
    const onClick = jasmine.createSpy('onClick');
    const rendered = PhotoUploadOverlay({
      url: null,
      alt: 'Epic Quest',
      canEdit: true,
      onClick,
    });

    const button = findElement(rendered, (child) => child.type === 'button');
    button.props.onClick();

    expect(onClick).toHaveBeenCalled();
  });

  it('does not apply the grayscale class by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
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
      React.createElement(PhotoUploadOverlay, {
        url: null,
        alt: 'Epic Quest',
        canEdit: true,
        onClick: Noop.noop,
        grayscale: true,
      })
    );

    expect(html).toContain('photo-grayscale');
  });

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
