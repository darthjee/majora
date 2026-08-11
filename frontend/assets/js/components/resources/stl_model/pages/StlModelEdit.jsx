import { useEffect, useMemo, useState } from 'react';
import StlModelEditController from './controllers/StlModelEditController.js';
import StlModelEditHelper from './helpers/StlModelEditHelper.jsx';
import StlModelHelper from './helpers/StlModelHelper.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';
import { TYPE_VALUES } from '../stlModelEnums.js';

/**
 * STL model edit page.
 *
 * @returns {React.ReactElement} STL model edit page element.
 */
export default function StlModelEdit() {
  const [stlModel, setStlModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const {
    state: fields, setField, handleChange, handleCheckboxChange,
  } = useFormState({
    name: '', owned: true, type: TYPE_VALUES[0], race: '', role: '',
  });

  const controller = useMemo(
    () => new StlModelEditController(setStlModel, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const stlModelId = StlModelEditController.getStlModelIdFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!stlModel) return;

    setField('name', stlModel.name ?? '');
    setField('owned', stlModel.owned ?? true);
    setField('type', stlModel.type ?? TYPE_VALUES[0]);
    setField('race', stlModel.race ?? '');
    setField('role', stlModel.role ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stlModel]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    stlModelId,
    fields,
    { setStatus, setFieldErrors },
  );

  if (loading) return StlModelEditHelper.renderLoading();
  if (error) return StlModelHelper.renderError(error);

  return StlModelEditHelper.render(
    { ...fields, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: handleChange('name'),
      onOwnedChange: handleCheckboxChange('owned'),
      onTypeChange: handleChange('type'),
      onRaceChange: handleChange('race'),
      onRoleChange: handleChange('role'),
    },
  );
}
