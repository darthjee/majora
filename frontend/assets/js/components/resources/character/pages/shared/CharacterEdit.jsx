import { useEffect, useMemo, useState } from 'react';
import CharacterHelper from '../helpers/CharacterHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import LinksEditModal from '../elements/LinksEditModal.jsx';
import MoneyEditModal from '../../../../common/modals/MoneyEditModal.jsx';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import useFormState from '../../../../../utils/useFormState.js';

/**
 * Shared character edit page component.
 *
 * @description Accepts type-specific controller class, hash param extractor, and
 *   edit helper instance as props, so NPC and PC edit pages can share identical logic.
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Edit controller class to instantiate.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @param {import('../helpers/BaseCharacterEditHelper.jsx').default} props.EditHelper - Edit helper instance
 *   with `render` and `renderLoading` methods.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @returns {React.ReactElement} Character edit page element.
 */
export default function CharacterEdit({ ControllerClass, getParamsFromHash, EditHelper, characterKind }) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [links, setLinks] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const { state: fields, setField, handleChange, handleCheckboxChange } = useFormState({
    name: '',
    role: '',
    description: '',
    privateDescription: '',
    money: '',
    allegiance: 'neutral',
    publicAllegiance: 'neutral',
    publicSlain: false,
    hidden: false,
  });

  const controller = useMemo(
    () => new ControllerClass(setCharacter, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedCharacter(character, gameSlug, characterId, {
      setName: (value) => setField('name', value),
      setRole: (value) => setField('role', value),
      setDescription: (value) => setField('description', value),
      setPrivateDescription: (value) => setField('privateDescription', value),
      setMoney: (value) => setField('money', value),
      setAllegiance: (value) => setField('allegiance', value),
      setPublicAllegiance: (value) => setField('publicAllegiance', value),
      setPublicSlain: (value) => setField('publicSlain', value),
      setHidden: (value) => setField('hidden', value),
      setLinks,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    characterId,
    { ...fields, links },
    { setStatus, setFieldErrors },
    character?.can_edit,
  );

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  if (!character || (!character.can_edit && !character.is_player)) return EditHelper.renderLoading();

  const uploadPath = `/games/${gameSlug}/${characterKind}/${characterId}/photo_upload.json`;
  const gameType = character.game_type ?? 'dnd';

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return (
    <>
      {EditHelper.render(
        {
          isFullEditor: character.can_edit,
          ...fields,
          profile_photo_path: character.profile_photo_path,
          links,
          treasureValue: character?.treasure_value ?? 0,
          gameType,
          status,
          fieldErrors,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onRoleChange: handleChange('role'),
          onDescriptionChange: handleChange('description'),
          onPrivateDescriptionChange: handleChange('privateDescription'),
          onMoneyChange: handleChange('money'),
          onAllegianceChange: handleChange('allegiance'),
          onPublicAllegianceChange: handleChange('publicAllegiance'),
          onPublicSlainChange: handleCheckboxChange('publicSlain'),
          onHiddenChange: handleCheckboxChange('hidden'),
          onOpenUploadModal: () => setShowUploadModal(true),
          onOpenLinksModal: () => setShowLinksModal(true),
          onOpenMoneyModal: () => setShowMoneyModal(true),
        }
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      <LinksEditModal
        show={showLinksModal}
        links={links}
        onClose={() => setShowLinksModal(false)}
        onConfirm={(newLinks) => {
          setLinks(newLinks);
          setShowLinksModal(false);
        }}
      />
      <MoneyEditModal
        show={showMoneyModal}
        money={fields.money}
        context="character"
        gameType={gameType}
        onClose={() => setShowMoneyModal(false)}
        onConfirm={(newTotal) => {
          setField('money', String(newTotal));
          setShowMoneyModal(false);
        }}
      />
    </>
  );
}
