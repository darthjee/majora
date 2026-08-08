import { useEffect, useState } from 'react';
import AccessStore from './store/AccessStore.js';

/**
 * Build a mount-effect callback resolving whether the current viewer is staff or a superuser.
 * Extracted as a plain function (rather than inlined in a `useEffect` callback) so it can be
 * exercised directly in specs without depending on React's effect timing (`useEffect` callbacks
 * never run under `renderToStaticMarkup`).
 *
 * @param {Function} setIsStaffOrSuperUser - State setter for the resolved staff-or-superuser
 *   status.
 * @returns {Function} Effect callback, following `useEffect`'s cleanup-return convention (guards
 *   against setting state after unmount).
 */
export function buildStaffOrSuperUserEffect(setIsStaffOrSuperUser) {
  return () => {
    let mounted = true;

    AccessStore.ensureStaffOrSuperUser().then((allowed) => {
      if (mounted) {
        setIsStaffOrSuperUser(Boolean(allowed));
      }
    });

    return () => {
      mounted = false;
    };
  };
}

/**
 * Reusable page-level hook resolving whether the current viewer is staff or a superuser into
 * local state, for pages with no other reason to own a full access-check controller (e.g.
 * `StlModels`/`StlModel`, whose list/detail data loading has no permission concept of its own).
 *
 * @returns {boolean} Whether the current viewer is staff or a superuser (`false` until resolved).
 */
export default function useStaffOrSuperUser() {
  const [isStaffOrSuperUser, setIsStaffOrSuperUser] = useState(false);

  useEffect(() => buildStaffOrSuperUserEffect(setIsStaffOrSuperUser)(), []);

  return isStaffOrSuperUser;
}
