import { useEffect, useMemo, useState } from 'react';
import CharacterHelper from '../helpers/CharacterHelper.jsx';
import PhotoUploadModal from '../../../../common/PhotoUploadModal.jsx';
import LinksEditModal from '../elements/LinksEditModal.jsx';
import MoneyEditModal from '../elements/MoneyEditModal.jsx';

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
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [privateDescription, setPrivateDescription] = useState('');
  const [money, setMoney] = useState('');
  const [allegiance, setAllegiance] = useState('neutral');
  const [publicAllegiance, setPublicAllegiance] = useState('neutral');
  const [links, setLinks] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setCharacter, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedCharacter(character, gameSlug, characterId, {
      setName,
      setRole,
      setDescription,
      setPrivateDescription,
      setMoney,
      setAllegiance,
      setPublicAllegiance,
      setLinks,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    characterId,
    {
      name, role, description, privateDescription, money, allegiance, publicAllegiance, links,
    },
    { setStatus, setFieldErrors },
  );

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  if (!character || !character.can_edit) return EditHelper.renderLoading();

  const uploadPath = `/games/${gameSlug}/${characterKind}/${characterId}/photo_upload.json`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return (
    <>
      {EditHelper.render(
        {
          name,
          profile_photo_path: character.profile_photo_path,
          links,
          role,
          description,
          privateDescription,
          money,
          allegiance,
          publicAllegiance,
          status,
          fieldErrors,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onRoleChange: (event) => setRole(event.target.value),
          onDescriptionChange: (event) => setDescription(event.target.value),
          onPrivateDescriptionChange: (event) => setPrivateDescription(event.target.value),
          onMoneyChange: (event) => setMoney(event.target.value),
          onAllegianceChange: (event) => setAllegiance(event.target.value),
          onPublicAllegianceChange: (event) => setPublicAllegiance(event.target.value),
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
        money={money}
        onClose={() => setShowMoneyModal(false)}
        onConfirm={(newTotal) => {
          setMoney(String(newTotal));
          setShowMoneyModal(false);
        }}
      />
    </>
  );
}
