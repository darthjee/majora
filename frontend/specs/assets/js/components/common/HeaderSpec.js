import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Header from '../../../../../assets/js/components/common/Header.jsx';
import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import HealthClient from '../../../../../assets/js/client/HealthClient.js';
import HeaderController from '../../../../../assets/js/components/common/controllers/HeaderController.js';
import HeaderHelper from '../../../../../assets/js/components/common/helpers/HeaderHelper.jsx';

describe('Header', function() {
  beforeEach(function() {
    spyOn(AuthClient.prototype, 'status').and.returnValue(
      Promise.resolve({ ok: true, json: () => Promise.resolve({ logged_in: false }) })
    );
    spyOn(HealthClient.prototype, 'check').and.returnValue(
      Promise.resolve({ ok: true, status: 200 })
    );
    spyOn(HeaderController.prototype, 'startHealthCheck');
    spyOn(HeaderController.prototype, 'stopHealthCheck');
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

  it('renders a register link when logged out', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).toContain('data-testid="register-control"');
    expect(html).toContain('href="#/users/register"');
  });

  it('does not render the send-test-email link when logged out', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).not.toContain('data-testid="send-test-email"');
  });

  it('renders the language selector', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).toContain('data-testid="language-selector"');
  });

  it('renders the resilience indicator', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).toContain('data-testid="resilience-indicator"');
  });

  it('does not render the server status indicator by default', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).not.toContain('data-testid="server-status"');
  });

  it('does not render the Staff Users nav link by default', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).not.toContain('href="#/staff/users"');
  });

  it('does not render the view-as link by default', function() {
    const html = renderToStaticMarkup(React.createElement(Header));
    expect(html).not.toContain('data-testid="view-as-link"');
  });

  describe('view-as wiring', function() {
    it('passes canViewAs/showViewAsModal and wires the view-as handlers', function() {
      let capturedState;
      let capturedHandlers;

      spyOn(HeaderHelper, 'render').and.callFake((state, handlers) => {
        capturedState = state;
        capturedHandlers = handlers;
        return React.createElement('div', null, 'header');
      });

      renderToStaticMarkup(React.createElement(Header));

      expect(capturedState.canViewAs).toBe(false);
      expect(capturedState.showViewAsModal).toBe(false);
      expect(() => {
        capturedHandlers.onViewAsClick();
        capturedHandlers.onViewAsModalClose();
      }).not.toThrow();
    });
  });

  describe('route state', function() {
    let originalWindow;

    beforeEach(function() {
      originalWindow = globalThis.window;
    });

    afterEach(function() {
      globalThis.window = originalWindow;
    });

    it('initializes route from the current hash and renders the game nav links', function() {
      globalThis.window = { location: { hash: '#/games/campaign' } };
      const html = renderToStaticMarkup(React.createElement(Header));

      expect(html).toContain('href="#/games/campaign/treasures"');
      expect(html).toContain('href="#/games/campaign/sessions"');
      expect(html).toContain('href="#/games/campaign/photos"');
    });

    it('renders the character photos nav link on a pc character route', function() {
      globalThis.window = { location: { hash: '#/games/campaign/pcs/7' } };
      const html = renderToStaticMarkup(React.createElement(Header));

      expect(html).toContain('href="#/games/campaign/pcs/7/photos"');
    });

    it('does not render the game nav links on unrelated routes', function() {
      globalThis.window = { location: { hash: '#/games' } };
      const html = renderToStaticMarkup(React.createElement(Header));

      expect(html).not.toContain('/treasures"');
      expect(html).not.toContain('/sessions"');
    });

    it('does not render the game nav links when window is unavailable', function() {
      delete globalThis.window;
      const html = renderToStaticMarkup(React.createElement(Header));

      expect(html).not.toContain('/treasures"');
      expect(html).not.toContain('/sessions"');
    });

    it('wires the route effect lifecycle without throwing', function() {
      globalThis.window = { location: { hash: '#/games/campaign' } };

      expect(() => renderToStaticMarkup(React.createElement(Header))).not.toThrow();
    });
  });
});
