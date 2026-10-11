import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyRowStatus from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyRowStatus.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

const render = (row) => renderToStaticMarkup(React.createElement(StaffCopyRowStatus, { row }));

describe('StaffCopyRowStatus', function() {
  it('renders the already-copied badge', function() {
    expect(render({ copied_to_target: true })).toContain(Translator.t('staff_copies_page.copied_to_target'));
  });

  it('renders the name-taken badge when present', function() {
    expect(render({ name_taken_in_target: true })).toContain(Translator.t('staff_copies_page.entity_error.name_taken'));
  });

  it('renders no badge for a fresh row', function() {
    expect(render({ copied_to_target: false })).not.toContain('badge');
  });
});
