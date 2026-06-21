import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Header from '../../../../../assets/js/components/elements/Header.jsx';
import AuthClient from '../../../../../assets/js/client/AuthClient.js';

describe('Header', function() {
  beforeEach(function() {
    spyOn(AuthClient.prototype, 'status').and.returnValue(
      Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: false }) })
    );
  });

  it('renders a home link on the title', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).toContain('href="#/"');
    expect(html).toContain('Majora');
  });

  it('renders a Games nav link', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).toContain('href="#/games"');
    expect(html).toContain('Games');
  });

  it('renders a Login control by default', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).toContain('data-testid="auth-control"');
    expect(html).toContain('Login');
  });

  it('does not render the send-test-email link when logged out', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).not.toContain('data-testid="send-test-email"');
  });

  it('renders the language selector', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).toContain('data-testid="language-selector"');
  });
});
