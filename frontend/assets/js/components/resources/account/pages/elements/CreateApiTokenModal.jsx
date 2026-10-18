import { useEffect, useMemo, useState } from 'react';
import CreateApiTokenModalController from './controllers/CreateApiTokenModalController.js';
import CreateApiTokenModalHelper from './helpers/CreateApiTokenModalHelper.jsx';

/**
 * Modal creating a scoped API token (issue #1605): a form view (name, scopes, games, expiry)
 * that switches, on success, to a static secret view showing the token once.
 *
 * @description The secret lives only in this component's state and is cleared on Done.
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object|null} props.options - The `options.json` payload, or `null` when not loaded.
 * @param {Function} props.onCancel - Called when the form view is dismissed.
 * @param {Function} props.onCreated - Called on Done after a token was created; the caller hides
 *   the modal and re-fetches the list.
 * @returns {React.ReactElement} Rendered create modal.
 */
export default function CreateApiTokenModal({
  show, options, onCancel, onCreated,
}) {
  const [form, setForm] = useState(CreateApiTokenModalController.emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [secret, setSecret] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);

  const controller = useMemo(
    () => new CreateApiTokenModalController({
      setStatus, setFieldErrors, setSecret, setCopyStatus,
    }),
    [],
  );

  const reset = () => {
    setForm(CreateApiTokenModalController.emptyForm());
    setFieldErrors({});
    setStatus('idle');
    setSecret(null);
    setCopyStatus(null);
  };

  useEffect(() => {
    if (show) reset();
  }, [show]);

  const setField = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));

  return CreateApiTokenModalHelper.render(
    {
      show, form, fieldErrors, status, secret, copyStatus, options,
      canSubmit: CreateApiTokenModalController.canSubmit(form, status, options),
    },
    {
      onCancel,
      onSubmit: (event) => controller.submit(event, form),
      onNameChange: (event) => setField('name')(event.target.value),
      onScopesChange: setField('scopes'),
      onGamesChange: setField('games'),
      onExpiryChange: setField('expiry'),
      onCopy: () => controller.copy(secret.token),
      onDone: () => {
        reset();
        onCreated();
      },
    },
  );
}
