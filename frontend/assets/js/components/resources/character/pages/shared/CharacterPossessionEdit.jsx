import { useEffect, useMemo, useState } from 'react';
import PossessionEditHelper from '../../../possession/pages/helpers/PossessionEditHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import useFormState from '../../../../../utils/useFormState.js';

/**
 * Shared PC/NPC possession edit page component (issue #1076): loads a `CharacterPossession`
 * (via the given controller class, which first resolves its underlying `game_possession_id`
 * through the character-scoped detail endpoint, then loads the full `GamePossession` itself),
 * lets the user edit `name`/`description`/`hidden` through {@link PossessionEditHelper} — the
 * same helper `GamePossessionEdit` uses, since the layout is identical — and PATCHes
 * `.../possessions/:game_possession_id.json` directly on submit (unlike `CharacterItemEdit`,
 * which edits the `CharacterItem`'s own override fields: `CharacterPossession` has none — see the
 * main plan's "Attribute delegation model"). Also wires up the photo upload modal, hand-building
 * its upload path against the `GamePossession` id, mirroring `GamePossessionEdit.jsx`'s own
 * wiring.
 *
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Possession edit controller class to instantiate
 *   (already bound to a character kind).
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @returns {React.ReactElement} Character possession edit page element.
 */
export default function CharacterPossessionEdit({ ControllerClass, getParamsFromHash }) {
  const [possession, setPossession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { state: fields, setField, handleChange, handleCheckboxChange } = useFormState({
    name: '',
    description: '',
    hidden: false,
  });

  const controller = useMemo(
    () => new ControllerClass(setPossession, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const {
    game_slug: gameSlug, character_id: characterId, id: characterPossessionId,
  } = getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedItem(possession, {
      setName: (value) => setField('name', value),
      setDescription: (value) => setField('description', value),
      setHidden: (value) => setField('hidden', value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [possession]);

  const handleSubmit = (event) => controller.submitForm(
    event, gameSlug, characterId, characterPossessionId, possession?.game_possession_id, fields,
    { setStatus, setFieldErrors },
  );

  if (loading) return PossessionEditHelper.renderLoading();
  if (error) return PossessionEditHelper.renderError(error);

  const uploadPath = `/games/${gameSlug}/possessions/${possession.game_possession_id}/photo_upload.json`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return (
    <>
      {PossessionEditHelper.render(
        { ...fields, photo_path: possession.photo_path, status, fieldErrors },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onDescriptionChange: handleChange('description'),
          onHiddenChange: handleCheckboxChange('hidden'),
          onOpenUploadModal: () => setShowUploadModal(true),
        }
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
