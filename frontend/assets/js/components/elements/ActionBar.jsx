import React from 'react';
import Translator from '../../i18n/Translator.js';
import Icons from '../../utils/Icons.js';

const SECONDARY_BUTTON_POSITION_CLASSES = [
  'actions-overlay-button-right',
  'actions-overlay-button-right-2',
];

/**
 * Render the primary upload button, using the centered modifier class when
 * no secondary button is present, or the left modifier class when it is.
 *
 * @param {boolean} canEdit - Whether the current user may upload a new photo.
 * @param {Function} onClick - Handler invoked when the upload button is clicked.
 * @param {boolean} hasSecondaryButtons - Whether secondary buttons will also be rendered.
 * @returns {React.ReactElement|null} Upload button element, or null when canEdit is false.
 */
function renderUploadButton(canEdit, onClick, hasSecondaryButtons) {
  if (!canEdit) {
    return null;
  }

  const modifierClass = hasSecondaryButtons
    ? 'actions-overlay-button-left'
    : 'actions-overlay-button';
  const label = Translator.t('photo_upload_modal.title');

  return (
    <button
      type="button"
      className={`btn btn-secondary ${modifierClass}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <i className={`bi ${Icons.camera}`} aria-hidden="true"></i>
    </button>
  );
}

/**
 * Render the optional secondary overlay buttons (e.g. Slain/Revive), stacked
 * at the bottom-right of the overlay.
 *
 * @param {{label: string, variant: string, icon: string, onClick: Function}[]} secondaryButtons - Secondary
 *   button definitions (0-2 entries).
 * @returns {React.ReactElement[]} Secondary button elements.
 */
function renderSecondaryButtons(secondaryButtons) {
  return secondaryButtons.map((secondaryButton, index) => (
    <button
      key={secondaryButton.label}
      type="button"
      className={`btn btn-${secondaryButton.variant} ${SECONDARY_BUTTON_POSITION_CLASSES[index]}`}
      onClick={secondaryButton.onClick}
      aria-label={secondaryButton.label}
      title={secondaryButton.label}
    >
      <i className={`bi ${secondaryButton.icon}`} aria-hidden="true"></i>
    </button>
  ));
}

/**
 * Renders the photo-upload button and the optional secondary overlay action
 * buttons (e.g. Slain/Revive) hosted by {@link ActionsOverlay}.
 *
 * @description Only renders the upload button when `canEdit` is true — for
 *   users without edit access the button is omitted entirely, not just
 *   disabled. Renders up to two secondary overlay action buttons alongside
 *   the upload button, giving the upload button its left-modifier class
 *   whenever at least one secondary button is present.
 * @param {object} props - Component props.
 * @param {boolean} [props.canEdit] - Whether the current user may upload a new photo.
 * @param {Function} props.onClick - Handler invoked when the upload button is clicked.
 * @param {{label: string, variant: string, icon: string, onClick: Function}[]} [props.secondaryButtons] - Optional
 *   secondary overlay buttons (e.g. real/public Slain-Revive), stacked at the bottom right,
 *   rendered when the primary upload button is present on the left.
 * @returns {React.ReactElement} Upload button and secondary button row.
 */
export default function ActionBar({ canEdit, onClick, secondaryButtons = [] }) {
  return (
    <>
      {renderUploadButton(canEdit, onClick, secondaryButtons.length > 0)}
      {renderSecondaryButtons(secondaryButtons)}
    </>
  );
}
