import { useState, useMemo } from 'react';
import AuthStorage from '../../../utils/auth/AuthStorage.js';
import Noop from '../../../utils/Noop.js';
import PhotoUploadModalController from './controllers/PhotoUploadModalController.js';
import PhotoUploadModalHelper from './helpers/PhotoUploadModalHelper.jsx';

/**
 * Photo upload modal component.
 *
 * @description In its default (immediate) mode, Confirm uploads the file right
 *   away against `uploadPath`. When `deferred` is true, no request is made and
 *   `uploadPath` is not needed: Confirm instead hands the picked `File` to
 *   `onFileConfirmed` and closes, letting the caller keep the file in its own
 *   state until a target (e.g. a not-yet-created entity) exists to upload it to.
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {string} [props.uploadPath] - Full path to the photo upload init endpoint.
 *   Optional when `deferred` is true.
 * @param {boolean} [props.deferred] - Whether to defer the actual upload instead of
 *   firing it immediately. Defaults to `false`.
 * @param {Function} [props.onFileConfirmed] - Called with the picked `File` when
 *   Confirm is clicked in deferred mode.
 * @param {Function} props.onClose - Called when the modal is dismissed or cancelled.
 * @param {Function} [props.onSuccess] - Called after a successful immediate-mode upload.
 * @param {object} [props.fileUploadOptions] - Options for the "file-upload variant" (issue #726),
 *   always used together.
 * @param {string} [props.fileUploadOptions.translationPrefix] - i18n key prefix for the modal's
 *   strings. Defaults to `photo_upload_modal`, preserving today's photo-upload behavior; the
 *   file-upload variant passes `file_upload_modal`.
 * @param {string} [props.fileUploadOptions.accept] - Value forwarded to the
 *   `<input type="file">`'s `accept` attribute, e.g. `.pdf` for file mode. Left unset for the
 *   default photo behavior (no restriction).
 * @param {boolean} [props.fileUploadOptions.showNameField] - Whether to render an optional name
 *   text input (issue #874), sent alongside the file on submit. Defaults to `false`, preserving
 *   today's photo-upload behavior; the file-upload variant passes `true`.
 * @param {boolean} [props.fileUploadOptions.showPhotoField] - Whether to render an optional
 *   second file input for an image (issue #878), sent as a chained second upload after the main
 *   file upload succeeds. Defaults to `false`; the file-upload variant passes `true`.
 * @param {Function} [props.fileUploadOptions.photoUploadPathBuilder] - Function taking the newly
 *   created file's id (returned by the main upload's init response) and returning the
 *   photo-upload init path (issue #878). Required when `showPhotoField` is `true` and a photo
 *   file was picked.
 * @returns {React.ReactElement} Rendered photo upload modal.
 */
export default function PhotoUploadModal({
  show, uploadPath, deferred = false, onFileConfirmed = Noop.noop, onClose, onSuccess,
  fileUploadOptions = {},
}) {
  const {
    translationPrefix = 'photo_upload_modal', accept, showNameField = false,
    showPhotoField = false, photoUploadPathBuilder,
  } = fileUploadOptions;
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const controller = useMemo(
    () => new PhotoUploadModalController(setError, setUploading, onSuccess),
    [onSuccess],
  );

  const handleClose = () => {
    controller.handleClear();
    setFile(null);
    setName('');
    setPhotoFile(null);

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (deferred) {
      onFileConfirmed(file);
      handleClose();
      return;
    }

    setUploading(true);
    const token = AuthStorage.getToken();
    const photoUpload = showPhotoField && photoFile
      ? { file: photoFile, buildPath: photoUploadPathBuilder }
      : undefined;

    if (photoUpload) {
      controller.handleSubmit(uploadPath, file, token, name, photoUpload);
    } else if (showNameField) {
      controller.handleSubmit(uploadPath, file, token, name);
    } else {
      controller.handleSubmit(uploadPath, file, token);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handlePhotoFileChange = (event) => {
    setPhotoFile(event.target.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];

    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  return PhotoUploadModalHelper.render(
    show,
    {
      file, error, uploading, deferred, translationPrefix, accept, showNameField, name,
      showPhotoField,
    },
    {
      onClose: handleClose,
      onCancel: handleClose,
      onSubmit: handleSubmit,
      onFileChange: handleFileChange,
      onNameChange: handleNameChange,
      onPhotoFileChange: handlePhotoFileChange,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  );
}
