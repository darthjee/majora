import { useEffect, useMemo, useState } from 'react';
import AccessStore from '../../../utils/access/store/AccessStore.js';
import ViewAsModalController from './controllers/ViewAsModalController.js';
import ViewAsModalHelper from './helpers/ViewAsModalHelper.jsx';

/**
 * Stateful "view as" facade modal, letting admins/staff simulate a
 * `dm`/`player`/`owner` role across per-resource permission checks. Holds
 * its own local edit state, seeded from `AccessStore.getFacade()` whenever
 * the modal opens, independent from the committed facade until saved.
 *
 * @param {{show: boolean, onClose: Function, gameSlug: (string|undefined)}} props - Component props.
 * @returns {React.ReactElement} Rendered view-as modal.
 */
export default function ViewAsModal({ show, onClose, gameSlug }) {
  const [enabled, setEnabled] = useState(() => AccessStore.getFacade().enabled);
  const [roles, setRoles] = useState(() => AccessStore.getFacade().roles);

  useEffect(() => {
    if (!show) return;

    const facade = AccessStore.getFacade();

    setEnabled(facade.enabled);
    setRoles(facade.roles);
  }, [show]);

  const controller = useMemo(
    () => new ViewAsModalController(setEnabled, setRoles, onClose),
    [onClose],
  );

  return ViewAsModalHelper.render(
    show,
    { enabled, roles },
    {
      onCancel: () => controller.handleCancel(),
      onSave: () => controller.handleSave(enabled, roles, gameSlug),
      onToggleEnabled: () => controller.handleToggleEnabled(),
      onToggleRole: (role) => controller.handleToggleRole(role),
    },
  );
}
