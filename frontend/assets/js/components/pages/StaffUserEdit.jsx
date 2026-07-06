import { useEffect, useMemo, useState } from 'react';
import StaffUserEditController from './controllers/StaffUserEditController.js';
import StaffUserEditHelper from './helpers/StaffUserEditHelper.jsx';
import StaffUserHelper from './helpers/StaffUserHelper.jsx';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const controller = useMemo(
    () => new StaffUserEditController(setUser, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const userId = StaffUserEditController.getStaffUserIdFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!user) return;

    setName(user.name ?? '');
    setEmail(user.email ?? '');
  }, [user]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    userId,
    { name, email },
    { setStatus, setFieldErrors },
  );

  if (loading) return StaffUserEditHelper.renderLoading();
  if (error) return StaffUserHelper.renderError();

  return StaffUserEditHelper.render(
    { name, email, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onEmailChange: (event) => setEmail(event.target.value),
    },
  );
}
