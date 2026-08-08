import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useStaffOrSuperUser, { buildStaffOrSuperUserEffect }
  from '../../../../../assets/js/utils/access/useStaffOrSuperUser.js';
import AccessStore from '../../../../../assets/js/utils/access/store/AccessStore.js';

/**
 * Minimal component exercising `useStaffOrSuperUser`, used to assert the hook can be called from
 * a real component body without violating the rules of hooks.
 *
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost() {
  useStaffOrSuperUser();
  return React.createElement('div', null, 'ok');
}

describe('useStaffOrSuperUser', function() {
  it('does not throw when called from a component body', function() {
    spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(false));

    expect(() => renderToStaticMarkup(React.createElement(TestHost))).not.toThrow();
  });

  describe('.buildStaffOrSuperUserEffect', function() {
    it('resolves the staff-or-superuser status into the given setter', async function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      const setIsStaffOrSuperUser = jasmine.createSpy('setIsStaffOrSuperUser');

      buildStaffOrSuperUserEffect(setIsStaffOrSuperUser)();
      await Promise.resolve();
      await Promise.resolve();

      expect(setIsStaffOrSuperUser).toHaveBeenCalledWith(true);
    });

    it('coerces a falsy resolution to false', async function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(undefined));
      const setIsStaffOrSuperUser = jasmine.createSpy('setIsStaffOrSuperUser');

      buildStaffOrSuperUserEffect(setIsStaffOrSuperUser)();
      await Promise.resolve();
      await Promise.resolve();

      expect(setIsStaffOrSuperUser).toHaveBeenCalledWith(false);
    });

    it('does not call the setter once the cleanup function has run', async function() {
      spyOn(AccessStore, 'ensureStaffOrSuperUser').and.returnValue(Promise.resolve(true));
      const setIsStaffOrSuperUser = jasmine.createSpy('setIsStaffOrSuperUser');

      const cleanup = buildStaffOrSuperUserEffect(setIsStaffOrSuperUser)();
      cleanup();
      await Promise.resolve();
      await Promise.resolve();

      expect(setIsStaffOrSuperUser).not.toHaveBeenCalled();
    });
  });
});
