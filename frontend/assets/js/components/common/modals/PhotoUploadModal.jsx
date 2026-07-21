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
 * @returns {React.ReactElement} Rendered photo upload modal.
 */
export default function PhotoUploadModal({
  show, uploadPath, deferred = false, onFileConfirmed = Noop.noop, onClose, onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const controller = useMemo(
    () => new PhotoUploadModalController(setError, setUploading, onSuccess),
    [onSuccess],
  );

  const handleClose = () => {
    controller.handleClear();
    setFile(null);

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
    controller.handleSubmit(uploadPath, file, token);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
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
      file, error, uploading, deferred,
    },
    {
      onClose: handleClose,
      onCancel: handleClose,
      onSubmit: handleSubmit,
      onFileChange: handleFileChange,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  );
}
