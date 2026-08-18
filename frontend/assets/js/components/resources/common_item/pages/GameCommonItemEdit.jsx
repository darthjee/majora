import { useEffect, useMemo, useState } from 'react';
import CommonItemEditHelper from './helpers/CommonItemEditHelper.jsx';
import GameCommonItemEditController from './controllers/GameCommonItemEditController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game common item edit page (issue #826): loads a `GameCommonItem` via
 * {@link GameCommonItemEditController} (the DM/admin-only `.../common_items/:id/full.json`
 * endpoint), lets the user edit `name`/`description`/`price`/`category`/`hidden` through
 * {@link CommonItemEditHelper}, and PATCHes `.../common_items/:id.json` on submit. Also wires up
 * the photo upload modal for the (unrelated) upload action button, mirroring
 * `GamePossessionEdit`'s upload modal wiring — photo stays on its own dedicated endpoint,
 * unaffected by this form. Also wires up the price-editing modal (`MoneyEditModal`, reusing the
 * `'treasure'` money context), paired with the collapsed price field.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Common item edit controller class to instantiate,
 *   mainly for tests.
 * @returns {React.ReactElement} Game common item edit page element.
 */
export default function GameCommonItemEdit({ ControllerClass = GameCommonItemEditController }) {
  const [commonItem, setCommonItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const {
    state: fields, setField, handleChange, handleCheckboxChange,
  } = useFormState({
    name: '',
    description: '',
    price: '',
    category: 'other',
    hidden: false,
  });

  const controller = useMemo(
    () => new ControllerClass(setCommonItem, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, id: commonItemId } = GameCommonItemEditController.getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedItem(commonItem, {
      setName: (value) => setField('name', value),
      setDescription: (value) => setField('description', value),
      setPrice: (value) => setField('price', value),
      setCategory: (value) => setField('category', value),
      setHidden: (value) => setField('hidden', value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commonItem]);

  const handleSubmit = (event) => controller.submitForm(
    event, gameSlug, commonItemId, fields, { setStatus, setFieldErrors },
  );

  if (loading) return CommonItemEditHelper.renderLoading();
  if (error) return CommonItemEditHelper.renderError(error);

  const uploadPath = `/games/${gameSlug}/common_items/${commonItemId}/photo_upload.json`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return (
    <>
      {CommonItemEditHelper.render(
        { ...fields, photo_path: commonItem.photo_path, status, fieldErrors },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onDescriptionChange: handleChange('description'),
          onCategoryChange: handleChange('category'),
          onHiddenChange: handleCheckboxChange('hidden'),
          onOpenUploadModal: () => setShowUploadModal(true),
          onOpenPriceModal: () => setShowPriceModal(true),
        }
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
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
