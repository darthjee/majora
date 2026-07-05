import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import UploadButton from '../../../../../assets/js/components/elements/UploadButton.jsx';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('UploadButton', function() {
  it('renders a button with btn-secondary and mb-3 classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(UploadButton, { onClick: Noop.noop }, 'Upload Photo')
    );
    expect(html).toContain('btn-secondary');
    expect(html).toContain('mb-3');
  });

  it('renders as a button element, not a link', function() {
    const html = renderToStaticMarkup(
      React.createElement(UploadButton, { onClick: Noop.noop }, 'Upload Photo')
    );
    expect(html).toContain('<button');
    expect(html).not.toContain('<a href');
  });

  it('renders the children as button label', function() {
    const html = renderToStaticMarkup(
      React.createElement(UploadButton, { onClick: Noop.noop }, 'Upload Photo')
    );
    expect(html).toContain('Upload Photo');
  });

  it('wires the onClick prop to the button element', function() {
    const onClick = jasmine.createSpy('onClick');
    const element = UploadButton({ onClick, children: 'Upload Photo' });

    expect(element.props.onClick).toBe(onClick);
  });
});
