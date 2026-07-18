import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SubmitButton from '../../../../../../assets/js/components/common/buttons/SubmitButton.jsx';

describe('SubmitButton', function() {
  it('renders a submit button with btn-primary class', function() {
    const html = renderToStaticMarkup(
      React.createElement(SubmitButton, { disabled: false }, 'Save')
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('btn-primary');
  });

  it('renders the children as button label', function() {
    const html = renderToStaticMarkup(
      React.createElement(SubmitButton, { disabled: false }, 'Create Game')
    );
    expect(html).toContain('Create Game');
  });

  it('disables the button when disabled prop is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(SubmitButton, { disabled: true }, 'Save')
    );
    expect(html).toContain('disabled');
  });

  it('does not disable the button when disabled prop is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(SubmitButton, { disabled: false }, 'Save')
    );
    expect(html).not.toContain('disabled');
  });
});
