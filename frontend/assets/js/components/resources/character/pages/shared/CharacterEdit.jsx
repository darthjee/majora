import { useEffect, useMemo, useState } from 'react';
import CharacterHelper from '../helpers/CharacterHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import LinksEditModal from '../../../../common/modals/LinksEditModal.jsx';
import MoneyEditModal from '../../../../common/modals/MoneyEditModal.jsx';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../../utils/requests/resourceConfig.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import useFormState from '../../../../../utils/useFormState.js';
import resourceName from './characterResourceName.js';
import useLinksModal from './hooks/useLinksModal.js';
import useMoneyModal from './hooks/useMoneyModal.js';

/**
 * Whether the current user may reach the edit page for a character (full editor, any player of
 * the game, or any Staff account — for both PCs and NPCs, matching
 * `CharacterRegularEditPermission`/`NpcPlayerEditPermission` on the backend, issue #915).
 *
 * @param {object} character - Loaded character data object.
 * @param {boolean} [character.can_edit] - Whether the current user is a full (dm/admin/owner)
 *   editor of the character.
 * @param {boolean} [character.is_player] - Whether the current user is a player of the game.
 * @param {boolean} [character.is_staff] - Whether the current user is a Staff account.
 * @returns {boolean} Whether the edit page is reachable for this character/user pair.
 */
function canReachEditPage(character) {
  return Boolean(character.can_edit || character.is_player || character.is_staff);
}

/**
 * Builds the `applyLoadedCharacter` field-setter handlers object, bridging the controller's
 * generic `setXxx(value)` callback shape onto the page's `useFormState`-backed `setField`.
 *
 * @param {Function} setField - `setField(field, value)` from the page's form state.
 * @param {Function} setLinks - Raw `setLinks` setter from `useLinksModal()`.
 * @returns {object} Field-setter handlers, as expected by
 *   `BaseCharacterEditController#applyLoadedCharacter`.
 */
function buildSetFieldHandlers(setField, setLinks) {
  return {
    setName: (value) => setField('name', value),
    setRole: (value) => setField('role', value),
    setDescription: (value) => setField('description', value),
    setPrivateDescription: (value) => setField('privateDescription', value),
    setMoney: (value) => setField('money', value),
    setPrivateAllegiance: (value) => setField('privateAllegiance', value),
    setPublicAllegiance: (value) => setField('publicAllegiance', value),
    setPublicSlain: (value) => setField('publicSlain', value),
    setHidden: (value) => setField('hidden', value),
    setIncognito: (value) => setField('incognito', value),
    setLinks,
  };
}

/**
 * Private hook wrapping the photo-upload modal's `show` state together with its success handler
 * (purging the resource cache, since the photo upload saga doesn't go through
 * `RequestStore.mutate`) and its derived upload path.
 *
 * @param {object} controller - Edit controller instance, exposing `buildEffect`.
 * @param {string} characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {string|number} characterId - Character id.
 * @returns {{showUploadModal: boolean, openUploadModal: Function, closeUploadModal: Function,
 *   handleUploadSuccess: Function, uploadPath: string}} Photo-upload modal state and handlers.
 */
function usePhotoUploadModal(controller, characterKind, gameSlug, characterId) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // before `buildEffect()()`'s refetch, or that refetch would re-serve the pre-upload cache.
    RequestStore.purge({ resource: resourceName(characterKind) });
    controller.buildEffect()();
  };

  const uploadPath = resourceConfig.get('POST', resourceName(characterKind), 'single').regular.path(
    { gameSlug, id: characterId },
  );

  return {
    showUploadModal,
    openUploadModal: () => setShowUploadModal(true),
    closeUploadModal: () => setShowUploadModal(false),
    handleUploadSuccess,
    uploadPath,
  };
}

/**
 * Private hook bundling the edit page's load state (character/loading/error/fieldErrors, the
 * controller instance, and the hash-derived gameSlug/characterId), the submit status, and the
 * `useFormState`-backed field values, so the main component only needs a single call to set up
 * its state.
 *
 * @param {Function} ControllerClass - Edit controller class to instantiate.
 * @param {Function} getParamsFromHash - Hash-parsing function for this character type.
 * @returns {object} `{character, loading, error, fieldErrors, setFieldErrors, status,
 *   setStatus, controller, gameSlug, characterId, state, setField, handleChange,
 *   handleCheckboxChange}`.
 */
function useCharacterEditState(ControllerClass, getParamsFromHash) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const formState = useFormState({
    name: '',
    role: '',
    description: '',
    privateDescription: '',
    money: '',
    privateAllegiance: 'neutral',
    publicAllegiance: 'neutral',
    publicSlain: false,
    hidden: false,
    incognito: false,
  });

  const controller = useMemo(
    () => new ControllerClass(setCharacter, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  return {
    character,
    loading,
    error,
    fieldErrors,
    setFieldErrors,
    status,
    setStatus,
    controller,
    gameSlug,
    characterId,
    ...formState,
  };
}

/**
 * Builds the handlers object passed into `EditHelper.render`.
 *
 * @param {object} params - Handler-building params.
 * @param {Function} params.handleSubmit - Form submit handler.
 * @param {Function} params.handleChange - `useFormState`'s `handleChange` field factory.
 * @param {Function} params.handleCheckboxChange - `useFormState`'s `handleCheckboxChange` field
 *   factory.
 * @param {object} params.uploadModal - `usePhotoUploadModal()` result.
 * @param {object} params.linksModal - `useLinksModal()` result.
 * @param {object} params.moneyModal - `useMoneyModal()` result.
 * @returns {object} Handlers object for `EditHelper.render`.
 */
function buildCharacterEditHandlers({
  handleSubmit, handleChange, handleCheckboxChange, uploadModal, linksModal, moneyModal,
}) {
  return {
    onSubmit: handleSubmit,
    onNameChange: handleChange('name'),
    onRoleChange: handleChange('role'),
    onDescriptionChange: handleChange('description'),
    onPrivateDescriptionChange: handleChange('privateDescription'),
    onMoneyChange: handleChange('money'),
    onPrivateAllegianceChange: handleChange('privateAllegiance'),
    onPublicAllegianceChange: handleChange('publicAllegiance'),
    onPublicSlainChange: handleCheckboxChange('publicSlain'),
    onHiddenChange: handleCheckboxChange('hidden'),
    onIncognitoChange: handleCheckboxChange('incognito'),
    onOpenUploadModal: uploadModal.openUploadModal,
    onOpenLinksModal: linksModal.openLinksModal,
    onOpenMoneyModal: moneyModal.openMoneyModal,
  };
}

/**
 * Renders the photo-upload, links-edit, and money-edit modals for {@link CharacterEdit}.
 *
 * @param {object} props - Component props.
 * @param {object} props.uploadModal - `usePhotoUploadModal()` result.
 * @param {object} props.linksModal - `useLinksModal()` result.
 * @param {object} props.moneyModal - `useMoneyModal()` result.
 * @param {string} props.money - Current money field value, for the money modal.
 * @param {string} props.gameType - Game type, for the money modal.
 * @returns {React.ReactElement} The edit page's modals.
 */
function CharacterEditModals({
  uploadModal, linksModal, moneyModal, money, gameType,
}) {
  return (
    <>
      <PhotoUploadModal
        show={uploadModal.showUploadModal}
        uploadPath={uploadModal.uploadPath}
        onClose={uploadModal.closeUploadModal}
        onSuccess={uploadModal.handleUploadSuccess}
      />
      <LinksEditModal
        show={linksModal.showLinksModal}
        links={linksModal.links}
        onClose={linksModal.closeLinksModal}
        onConfirm={linksModal.confirmLinksModal}
      />
      <MoneyEditModal
        show={moneyModal.showMoneyModal}
        money={money}
        context="character"
        gameType={gameType}
        onClose={moneyModal.closeMoneyModal}
        onConfirm={moneyModal.confirmMoneyModal}
      />
    </>
  );
}

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
  const {
    character, loading, error, fieldErrors, setFieldErrors, status, setStatus,
    controller, gameSlug, characterId,
    state: fields, setField, handleChange, handleCheckboxChange,
  } = useCharacterEditState(ControllerClass, getParamsFromHash);

  const linksModal = useLinksModal();
  const moneyModal = useMoneyModal(setField);

  useEffect(() => {
    controller.applyLoadedCharacter(
      character, gameSlug, characterId, buildSetFieldHandlers(setField, linksModal.setLinks),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const uploadModal = usePhotoUploadModal(controller, characterKind, gameSlug, characterId);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    characterId,
    { ...fields, links: linksModal.links },
    { setStatus, setFieldErrors },
    character?.can_edit,
  );

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);
  if (!character || !canReachEditPage(character)) return EditHelper.renderLoading();

  const gameType = character.game_type ?? 'dnd';
  const handlers = buildCharacterEditHandlers({
    handleSubmit, handleChange, handleCheckboxChange, uploadModal, linksModal, moneyModal,
  });

  return (
    <>
      {EditHelper.render(
        {
          isFullEditor: character.can_edit,
          canEditMoney: canReachEditPage(character),
          ...fields,
          photo_path: character.photo_path,
          links: linksModal.links,
          treasureValue: character?.treasure_value ?? 0,
          gameType,
          status,
          fieldErrors,
        },
        handlers,
      )}
      <CharacterEditModals
        uploadModal={uploadModal}
        linksModal={linksModal}
        moneyModal={moneyModal}
        money={fields.money}
        gameType={gameType}
      />
    </>
  );
}
