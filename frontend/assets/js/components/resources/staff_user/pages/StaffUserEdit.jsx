import { useEffect, useMemo, useState } from 'react';
import StaffUserEditController from './controllers/StaffUserEditController.js';
import StaffUserEditHelper from './helpers/StaffUserEditHelper.jsx';
import StaffUserHelper from './helpers/StaffUserHelper.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Staff user edit page.
 *
 * @returns {React.ReactElement} User edit page element.
 */
export default function StaffUserEdit() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const { state: fields, setField, handleChange } = useFormState({ name: '', email: '' });

  const controller = useMemo(
    () => new StaffUserEditController(setUser, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const userId = StaffUserEditController.getStaffUserIdFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!user) return;

    setField('name', user.name ?? '');
    setField('email', user.email ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    userId,
    fields,
    { setStatus, setFieldErrors },
  );

  if (loading) return StaffUserEditHelper.renderLoading();
  if (error) return StaffUserHelper.renderError();

  return StaffUserEditHelper.render(
    { ...fields, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: handleChange('name'),
      onEmailChange: handleChange('email'),
    },
  );
}
