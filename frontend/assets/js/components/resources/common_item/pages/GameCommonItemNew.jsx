import { useEffect, useMemo, useState } from 'react';
import GameCommonItemNewController from './controllers/GameCommonItemNewController.js';
import GameCommonItemNewHelper from './helpers/GameCommonItemNewHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../utils/Noop.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game-level common item creation page (issue #826): creates a bare `GameCommonItem` with no
 * owning character (`GameCommonItem` has no character-owned family at all), gated to
 * dm/admin/staff/player via `can_create_common_item`. Mirrors `GamePossessionNew`'s
 * form/deferred-photo-upload wiring, plus a `price` field (collapsed display + `MoneyEditModal`,
 * reusing the `'treasure'` money context) and a `category` `<select>`.
 *
 * @returns {React.ReactElement} Game common item creation page element.
 */
export default function GameCommonItemNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [gameCommonItemId, setGameCommonItemId] = useState(null);
  const { state: fields, setField, handleChange, handleCheckboxChange } = useFormState({
    name: '', description: '', price: '', category: 'other', hidden: false,
  });

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(
    '/games/:game_slug/common_items/new', 'game_slug', currentHash,
  );

  const controller = useMemo(() => new GameCommonItemNewController(Noop.noop, setFieldErrors), []);

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
    { ...fields, photoFile },
    {
      setStatus, setFieldErrors, setGameCommonItemId,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    gameCommonItemId,
    photoFile,
    { setStatus, setGameCommonItemId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/common_items`;
    }
  };

  return (
    <>
      {GameCommonItemNewHelper.render(
        {
          ...fields, status, fieldErrors, photo_path: photoPreviewUrl,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onDescriptionChange: handleChange('description'),
          onCategoryChange: handleChange('category'),
          onHiddenChange: handleCheckboxChange('hidden'),
          onOpenUploadModal: () => setShowUploadModal(true),
          onOpenPriceModal: () => setShowPriceModal(true),
          onRetryPhotoUpload: handleRetryPhotoUpload,
          onSkipPhotoUpload: handleSkipPhotoUpload,
        },
      )}
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
        show={showPriceModal}
        money={fields.price}
        context="treasure"
        onClose={() => setShowPriceModal(false)}
        onConfirm={(newTotal) => {
          setField('price', String(newTotal));
          setShowPriceModal(false);
        }}
      />
    </>
  );
}
