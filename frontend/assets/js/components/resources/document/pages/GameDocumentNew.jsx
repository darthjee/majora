import { useEffect, useMemo, useState } from 'react';
import GameDocumentNewController from './controllers/GameDocumentNewController.js';
import GameDocumentNewHelper from './helpers/GameDocumentNewHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../utils/Noop.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game-level document creation page (issue #758): creates a bare `GameDocument` with no owning
 * `CharacterDocument`, gated to dm/admin/staff via `can_create_document`. Simpler than
 * `GameItemNew` — no photo upload wiring at all (issue #758 scope decision).
 *
 * @returns {React.ReactElement} Game document creation page element.
 */
export default function GameDocumentNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const { state: fields, handleChange, handleCheckboxChange } = useFormState({
    name: '', description: '', hidden: false,
  });

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(
    '/games/:game_slug/documents/new', 'game_slug', currentHash,
  );

  const controller = useMemo(() => new GameDocumentNewController(Noop.noop, setFieldErrors), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    fields,
    { setStatus, setFieldErrors },
  );

  return GameDocumentNewHelper.render(
    { ...fields, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: handleChange('name'),
      onDescriptionChange: handleChange('description'),
      onHiddenChange: handleCheckboxChange('hidden'),
    },
  );
}
