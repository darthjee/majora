import StlModelsHelper from './helpers/StlModelsHelper.jsx';
import useStaffOrSuperUser from '../../../../utils/access/useStaffOrSuperUser.js';

/**
 * Render the STL models index page.
 *
 * @description Resolves whether the current viewer is staff or a superuser (via
 *   {@link useStaffOrSuperUser}), so `StlModelsHelper` can conditionally render the "New STL
 *   model" action. Unlike `Treasures.jsx`'s whole-page staff/superuser redirect gate,
 *   `/stl_models` stays open to every authenticated viewer — the list itself keeps rendering
 *   regardless of this check's result.
 * @returns {React.ReactElement} STL models page.
 */
export default function StlModels() {
  const isStaffOrSuperUser = useStaffOrSuperUser();

  return StlModelsHelper.render(isStaffOrSuperUser);
}
