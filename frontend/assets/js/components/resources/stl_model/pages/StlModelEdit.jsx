import { useEffect, useMemo, useState } from 'react';
import StlModelEditController from './controllers/StlModelEditController.js';
import StlModelEditHelper from './helpers/StlModelEditHelper.jsx';
import StlModelHelper from './helpers/StlModelHelper.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';
import Translator from '../../../../i18n/Translator.js';
import { TYPE_VALUES } from '../stlModelEnums.js';

/**
 * Shapes a raw `db_value[]` (`stlModel.races`/`stlModel.roles`, as returned by
 * `StlModelDetailSerializer`) into the `{id, name}`-keyed picks
 * `MultiResourcePickerField`/`StlModelFormFieldsHelper` render as badges — mirroring the shape
 * the picker itself produces when a user picks an entry (`id` is the raw constant string,
 * `name` its translated label). Exported as a plain, named function so it can be exercised
 * directly in specs.
 *
 * @param {string[]} rawValues - Raw constant values (e.g. `['elf', 'orc']`).
 * @param {string} translationPrefix - `stl_model_page` key prefix (`'race'`/`'role'`).
 * @returns {{id: string, name: string}[]} `{id, name}`-keyed picks.
 */
export function buildEnumPicks(rawValues, translationPrefix) {
  return (rawValues ?? []).map((value) => ({
    id: value, name: Translator.t(`stl_model_page.${translationPrefix}_${value}`),
  }));
}

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
    name: '', owned: true, type: TYPE_VALUES[0], races: [], roles: [], url: '', size: '',
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
    setField('races', buildEnumPicks(stlModel.races, 'race'));
    setField('roles', buildEnumPicks(stlModel.roles, 'role'));
    setField('url', stlModel.url ?? '');
    setField('size', stlModel.size ?? '');
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
      onRacesChange: (races) => setField('races', races),
      onRolesChange: (roles) => setField('roles', roles),
      onUrlChange: handleChange('url'),
      onSizeChange: handleChange('size'),
    },
  );
}
