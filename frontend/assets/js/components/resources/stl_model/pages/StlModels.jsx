import StlModelsHelper from './helpers/StlModelsHelper.jsx';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * Render the STL models index page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}), so `StlModelsHelper` can conditionally render the "New STL
 *   model" action. `/miniatures/stl_models` stays open to every authenticated viewer — the list
 *   itself keeps rendering regardless of this check's result. The "New STL model" action is a
 *   plain navigation link to `/miniatures/stl_models/new` (issue #1069 restored the full-page
 *   creation flow, replacing the former in-place modal — a real page navigation reloads the list
 *   naturally on return, so no `refreshToken`/`onSuccess` plumbing is needed here anymore).
 * @returns {React.ReactElement} STL models page.
 */
export default function StlModels() {
  const isStaffOrSuperUser = useStaffOrSuperUser();

  return StlModelsHelper.render(isStaffOrSuperUser);
}
