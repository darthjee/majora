import React from 'react';
import ConditionalComponent from '../../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../../common/misc/ErrorAlert.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import { formKey } from './recipeFormKeys.js';

/**
 * New/edit-mode right-column slot: the form's title, plus a submission error alert when the last
 * submit attempt failed, mirroring `CommonItemTitle` minus the photo-upload states.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {'new'|'edit'} context.mode - Current page mode.
 * @param {string} context.status - Current submission status.
 * @returns {React.ReactElement} Title element.
 */
export default function RecipeTitle({ mode, status }) {
  return (
    <>
      <h1>{Translator.t(formKey(mode, 'title'))}</h1>
      <ConditionalComponent render={status === 'error'}>
        <ErrorAlert error={Translator.t(formKey(mode, 'error'))} />
      </ConditionalComponent>
    </>
  );
}
