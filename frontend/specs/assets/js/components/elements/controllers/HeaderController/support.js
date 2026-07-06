import HeaderController from '../../../../../../../assets/js/components/elements/controllers/HeaderController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

/**
 * @description Builds fresh spies shared by every HeaderController spec file.
 * @returns {object} the setters and client spy used to construct the controller.
 */
export function buildContext() {
  return {
    setLoggedIn: jasmine.createSpy('setLoggedIn'),
    setShowModal: jasmine.createSpy('setShowModal'),
    setTestEmailStatus: jasmine.createSpy('setTestEmailStatus'),
    setIsSuperUser: jasmine.createSpy('setIsSuperUser'),
    setServerStatus: jasmine.createSpy('setServerStatus'),
    client: {
      status: jasmine.createSpy('status'),
      logout: jasmine.createSpy('logout'),
      sendTestEmail: jasmine.createSpy('sendTestEmail'),
      setLanguagePreference: jasmine.createSpy('setLanguagePreference'),
    },
  };
}

/**
 * @description Builds a HeaderController wired to the given context and overrides.
 * @param {object} ctx - the setters/client built by buildContext().
 * @param {object} overrides - optional setRoute/routeResolver/eventTarget overrides.
 * @returns {HeaderController} the built controller.
 */
export function buildHeaderController(ctx, overrides = {}) {
  return new HeaderController(
    ctx.setLoggedIn, ctx.setShowModal, ctx.setTestEmailStatus, ctx.setIsSuperUser, ctx.setServerStatus,
    ctx.client, overrides.healthClient, overrides.setIsStaff,
    overrides.setRoute ?? Noop.noop,
    overrides.routeResolver,
    overrides.eventTarget
  );
}

/**
 * @description Builds fresh spies shared by the startHealthCheck/stopHealthCheck spec files.
 * @returns {object} the setters, client, and healthClient spies used to construct the controller.
 */
export function buildHealthCheckContext() {
  return {
    ...buildContext(),
    healthClient: {
      check: jasmine.createSpy('check').and.returnValue(
        Promise.resolve({ ok: true, status: 200 })
      ),
    },
  };
}
