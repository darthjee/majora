import React from 'react';
import SubmitButton from '../../../../../common/buttons/SubmitButton.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formKey } from './recipeFormKeys.js';

/**
 * New/edit-mode right-column slot: the form's submit button, disabled while a submission is in
 * flight, mirroring `CommonItemSubmitButton`.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Submit button.
 */
export default function RecipeSubmitButton({ mode, status }) {
  return <SubmitButton disabled={status === 'submitting'}>{Translator.t(formKey(mode, 'submit'))}</SubmitButton>;
}
