import { useState, useMemo } from 'react';
import AuthStorage from '../../utils/AuthStorage.js';
import PhotoUploadModalController from './controllers/PhotoUploadModalController.js';
import PhotoUploadModalHelper from './helpers/PhotoUploadModalHelper.jsx';

/**
 * Photo upload modal component.
 *
 * @param {{show: boolean, uploadPath: string, onClose: Function, onSuccess: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered photo upload modal.
 */
export default function PhotoUploadModal({ show, uploadPath, onClose, onSuccess }) {
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
    { file, error, uploading },
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
