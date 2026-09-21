import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useHeaderState, { DEFAULT_DOMAIN_CONFIG }
  from '../../../../../../../assets/js/components/common/header/hooks/useHeaderState.js';
import HeaderController
  from '../../../../../../../assets/js/components/common/header/controllers/HeaderController.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';

/**
 * Minimal component exercising `useHeaderState`, capturing what the hook returns.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onResult - Callback invoked with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ onResult }) {
  onResult(useHeaderState());
  return React.createElement('div', null, 'ok');
}

describe('useHeaderState', function() {
  let result, route, gameAccess;

  beforeEach(function() {
    route = { page: 'home', gameSlug: 'my-game' };
    gameAccess = { is_dm: false, is_player: true };

    spyOn(HeaderController.prototype, 'getRoute').and.returnValue(route);
    spyOn(AccessStore, 'getGameAccess').and.returnValue(gameAccess);
    spyOn(AccessStore, 'getFacade').and.returnValue({ enabled: true });

    renderToStaticMarkup(React.createElement(TestHost, { onResult: (value) => { result = value; } }));
  });

  it('starts with the default flags', function() {
    expect(result.state).toEqual(jasmine.objectContaining({
      loggedIn: false,
      showModal: false,
      testEmailStatus: null,
      isSuperUser: false,
      isStaff: false,
      canViewAs: false,
      showViewAsModal: false,
    }));
  });

  it('starts with the default pending approval flag', function() {
    expect(result.pendingApproval).toBe(false);
  });

  it('starts with the default domain config', function() {
    expect(result.state.domainConfig).toEqual(DEFAULT_DOMAIN_CONFIG);
  });

  it('initializes the route from the HeaderController', function() {
    expect(result.state.route).toBe(route);
  });

  it('initializes the game access from the route game slug', function() {
    expect(AccessStore.getGameAccess).toHaveBeenCalledWith('my-game');
    expect(result.state.gameAccess).toBe(gameAccess);
  });

  it('initializes the facade flag from the AccessStore', function() {
    expect(result.state.facadeEnabled).toBe(true);
  });

  it('exposes a setter for every piece of state', function() {
    expect(Object.keys(result.setters).sort()).toEqual([
      'setCanViewAs',
      'setDomainConfig',
      'setFacadeEnabled',
      'setGameAccess',
      'setIsStaff',
      'setIsSuperUser',
      'setLoggedIn',
      'setPendingApproval',
      'setRoute',
      'setShowModal',
      'setShowViewAsModal',
      'setTestEmailStatus',
    ]);
  });
});
