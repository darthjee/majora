import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import Header from '../../../../../assets/js/components/common/Header.jsx';
import AuthClient from '../../../../../assets/js/client/AuthClient.js';
import HealthClient from '../../../../../assets/js/client/HealthClient.js';
import HeaderController from '../../../../../assets/js/components/common/controllers/HeaderController.js';
import HeaderHelper from '../../../../../assets/js/components/common/helpers/HeaderHelper.jsx';
import AccessStore from '../../../../../assets/js/utils/access/store/AccessStore.js';

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

    it('shows the view-as icon for a DM even when not really staff/superuser', function() {
      let capturedState;
      const originalWindow = globalThis.window;
      globalThis.window = { location: { hash: '#/games/campaign' } };
      spyOn(AccessStore, 'getGameAccess').and.returnValue({ is_dm: true, is_player: false, is_superuser: false, is_staff: false });

      spyOn(HeaderHelper, 'render').and.callFake((state, _handlers) => {
        capturedState = state;
        return React.createElement('div', null, 'header');
      });

      renderToStaticMarkup(React.createElement(Header));
      globalThis.window = originalWindow;

      expect(capturedState.canViewAs).toBe(true);
    });

    it('does not show the view-as icon for a non-DM, non-admin/staff user', function() {
      let capturedState;
      const originalWindow = globalThis.window;
      globalThis.window = { location: { hash: '#/games/campaign' } };
      spyOn(AccessStore, 'getGameAccess').and.returnValue({ is_dm: false, is_player: true, is_superuser: false, is_staff: false });

      spyOn(HeaderHelper, 'render').and.callFake((state, _handlers) => {
        capturedState = state;
        return React.createElement('div', null, 'header');
      });

      renderToStaticMarkup(React.createElement(Header));
      globalThis.window = originalWindow;

      expect(capturedState.canViewAs).toBe(false);
    });

    it('passes the current facade-enabled state and reacts to facade-changed events', function() {
      let capturedState;

      spyOn(AccessStore, 'getFacade').and.returnValue({ enabled: false, roles: [], gameSlug: null });
      spyOn(HeaderHelper, 'render').and.callFake((state, _handlers) => {
        capturedState = state;
        return React.createElement('div', null, 'header');
      });

      renderToStaticMarkup(React.createElement(Header));

      expect(capturedState.facadeEnabled).toBe(false);
    });

    it('does not throw when wiring the facade-changed subscription lifecycle', function() {
      expect(() => renderToStaticMarkup(React.createElement(Header))).not.toThrow();
    });
  });

  describe('game access wiring', function() {
    it('passes the fail-closed default gameAccess before any game route is resolved', function() {
      let capturedState;

      spyOn(HeaderHelper, 'render').and.callFake((state, _handlers) => {
        capturedState = state;
        return React.createElement('div', null, 'header');
      });

      renderToStaticMarkup(React.createElement(Header));

      expect(capturedState.gameAccess).toEqual(jasmine.objectContaining({ is_dm: null, is_player: false }));
    });

    it('reads the cached game access for the resolved gameSlug', function() {
      let capturedState;
      const originalWindow = globalThis.window;
      globalThis.window = { location: { hash: '#/games/campaign' } };
      spyOn(AccessStore, 'getGameAccess').and.returnValue({ is_dm: true, is_player: false, is_superuser: false, is_staff: false });

      spyOn(HeaderHelper, 'render').and.callFake((state, _handlers) => {
        capturedState = state;
        return React.createElement('div', null, 'header');
      });

      renderToStaticMarkup(React.createElement(Header));
      globalThis.window = originalWindow;

      expect(AccessStore.getGameAccess).toHaveBeenCalledWith('campaign');
      expect(capturedState.gameAccess).toEqual({ is_dm: true, is_player: false, is_superuser: false, is_staff: false });
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

    it('initializes route from the current hash and renders the game nav dropdown', function() {
      globalThis.window = { location: { hash: '#/games/campaign' } };
      const html = renderToStaticMarkup(React.createElement(Header));

      expect(html).toContain('href="#/games/campaign"');
      expect(html).toContain('href="#/games/campaign/pcs"');
      expect(html).toContain('href="#/games/campaign/npcs"');
      expect(html).toContain('href="#/games/campaign/treasures"');
      expect(html).toContain('href="#/games/campaign/photos"');
    });

    it('does not render the Polls/Sessions items before the game access effect resolves', function() {
      globalThis.window = { location: { hash: '#/games/campaign' } };
      const html = renderToStaticMarkup(React.createElement(Header));

      expect(html).not.toContain('href="#/games/campaign/polls"');
      expect(html).not.toContain('href="#/games/campaign/sessions"');
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
