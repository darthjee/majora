import { useState } from 'react';
import LanguageSelectorController from './controllers/LanguageSelectorController.js';
import LanguageSelectorHelper from './helpers/LanguageSelectorHelper.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Dropdown allowing the user to pick the active language, showing a flag
 * emoji and language code per entry.
 *
 * @param {{onLanguageChange: Function}} [props] - component props.
 * @param {Function} [props.onLanguageChange] - called with the newly selected language code.
 * @returns {React.ReactElement} rendered language selector.
 */
export default function LanguageSelector({ onLanguageChange } = {}) {
  const [language, setLanguage] = useState(Translator.getLanguage());

  const controller = new LanguageSelectorController(setLanguage, onLanguageChange);

  return LanguageSelectorHelper.render(
    { language, options: controller.getOptions() },
    { onChange: (event) => controller.handleLanguageChange(event.target.value) }
  );
}
