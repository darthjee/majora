import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import UploadButton from '../../../../../assets/js/components/elements/UploadButton.jsx';
import Noop from '../../../../../assets/js/utils/Noop.js';

const buildIcon = () => React.createElement('i', { className: 'bi bi-camera-fill', 'aria-hidden': 'true' });

describe('UploadButton', function() {
  it('renders a button with btn-secondary and mb-3 classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(UploadButton, { onClick: Noop.noop, label: 'Upload Photo' }, buildIcon())
    );
    expect(html).toContain('btn-secondary');
    expect(html).toContain('mb-3');
  });

  it('renders as a button element, not a link', function() {
    const html = renderToStaticMarkup(
      React.createElement(UploadButton, { onClick: Noop.noop, label: 'Upload Photo' }, buildIcon())
    );
    expect(html).toContain('<button');
    expect(html).not.toContain('<a href');
  });

  it('renders the icon children', function() {
    const html = renderToStaticMarkup(
      React.createElement(UploadButton, { onClick: Noop.noop, label: 'Upload Photo' }, buildIcon())
    );
    expect(html).toContain('bi-camera-fill');
  });

  it('sets aria-label and title to the given label', function() {
    const html = renderToStaticMarkup(
      React.createElement(UploadButton, { onClick: Noop.noop, label: 'Upload Photo' }, buildIcon())
    );
    expect(html).toContain('aria-label="Upload Photo"');
    expect(html).toContain('title="Upload Photo"');
  });

  it('wires the onClick prop to the button element', function() {
    const onClick = jasmine.createSpy('onClick');
    const element = UploadButton({ onClick, label: 'Upload Photo', children: 'Upload Photo' });

    expect(element.props.onClick).toBe(onClick);
  });
});
