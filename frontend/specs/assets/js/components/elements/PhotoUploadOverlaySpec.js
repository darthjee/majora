import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PhotoUploadOverlay from '../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';

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
        onClick: () => {},
      })
    );

    expect(html).toContain('card-photo-square');
    expect(html).toContain('http://example.com/photo.png');
  });

  it('renders a CardAvatar when type is avatar', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoUploadOverlay, {
        type: 'avatar',
        url: null,
        alt: 'Aragorn',
        canEdit: true,
        onClick: () => {},
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
        onClick: () => {},
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
        onClick: () => {},
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
        onClick: () => {},
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
        onClick: () => {},
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
});
