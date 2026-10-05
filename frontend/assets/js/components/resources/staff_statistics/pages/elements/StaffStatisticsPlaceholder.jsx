import Translator from '../../../../../i18n/Translator.js';

/**
 * Placeholder body of a statistics tab whose content is not implemented yet.
 *
 * @returns {React.ReactElement} Placeholder message.
 */
export default function StaffStatisticsPlaceholder() {
  return (
    <p className="text-muted" data-testid="statistics-placeholder">
      {Translator.t('staff_statistics_page.placeholder')}
    </p>
  );
}
