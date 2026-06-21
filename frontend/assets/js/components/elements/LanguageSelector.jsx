import { useState } from 'react';
import LanguageSelectorController from './controllers/LanguageSelectorController.js';
import LanguageSelectorHelper from './helpers/LanguageSelectorHelper.jsx';
import Translator from '../../i18n/Translator.js';

/**
 * Dropdown allowing the user to pick the active language, showing a flag
 * emoji and language code per entry.
 *
 * @returns {React.ReactElement} rendered language selector.
 */
export default function LanguageSelector() {
  const [language, setLanguage] = useState(Translator.getLanguage());

  const controller = new LanguageSelectorController(setLanguage);

  return LanguageSelectorHelper.render(
    { language, options: controller.getOptions() },
    { onChange: (event) => controller.handleLanguageChange(event.target.value) }
  );
}
