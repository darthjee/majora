import {
  useEffect, useMemo, useState,
} from 'react';
import GameNpcNewController from './controllers/GameNpcNewController.js';
import Noop from '../../../../utils/Noop.js';
import GameNpcNewHelper from './helpers/GameNpcNewHelper.jsx';
import LinksEditModal from './elements/LinksEditModal.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game NPC creation page.
 *
 * @returns {React.ReactElement} Game NPC creation page element.
 */
export default function GameNpcNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [links, setLinks] = useState([]);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [characterId, setCharacterId] = useState(null);
  const [gameType, setGameType] = useState('dnd');
  const { state: fields, setField, handleChange, handleCheckboxChange } = useFormState({
    name: '',
    role: '',
    description: '',
    privateDescription: '',
    hidden: false,
    money: '0',
    allegiance: 'neutral',
    publicAllegiance: 'neutral',
  });

  const controller = useMemo(
    () => new GameNpcNewController(Noop.noop, setFieldErrors, null, null, setGameType),
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GameNpcNewController.getGameSlugFromNpcNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );

  useEffect(() => () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
  }, [photoPreviewUrl]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { ...fields, links, photoFile },
    { setStatus, setFieldErrors, setCharacterId },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    characterId,
    photoFile,
    { setStatus, setCharacterId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/npcs/${characterId}`;
    }
  };

  return (
    <>
      {GameNpcNewHelper.render(
        {
          ...fields, links, gameType, status, fieldErrors, photoPreviewUrl,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onRoleChange: handleChange('role'),
          onDescriptionChange: handleChange('description'),
          onPrivateDescriptionChange: handleChange('privateDescription'),
          onOpenLinksModal: () => setShowLinksModal(true),
          onOpenUploadModal: () => setShowUploadModal(true),
          onOpenMoneyModal: () => setShowMoneyModal(true),
          onHiddenChange: handleCheckboxChange('hidden'),
          onAllegianceChange: handleChange('allegiance'),
          onPublicAllegianceChange: handleChange('publicAllegiance'),
          onRetryPhotoUpload: handleRetryPhotoUpload,
          onSkipPhotoUpload: handleSkipPhotoUpload,
        },
      )}
      <LinksEditModal
        show={showLinksModal}
        links={links}
        onClose={() => setShowLinksModal(false)}
        onConfirm={(newLinks) => {
          setLinks(newLinks);
          setShowLinksModal(false);
        }}
      />
      <PhotoUploadModal
        show={showUploadModal}
        deferred
        onFileConfirmed={(file) => {
          setPhotoFile(file);
          setShowUploadModal(false);
        }}
        onClose={() => setShowUploadModal(false)}
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
