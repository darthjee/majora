import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyFactionRow from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyFactionRow.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyFactionRow', function() {
  let row;

  const render = (overrides = {}) => renderToStaticMarkup(
    React.createElement('table', null, React.createElement('tbody', null, React.createElement('tr', null,
      React.createElement(StaffCopyFactionRow, { row: { ...row, ...overrides }, selected: false, onToggle: jasmine.createSpy('onToggle') }),
    ))),
  );

  beforeEach(function() {
    row = {
      id: 3, name: 'Thieves Guild', photo: 'photos/games/a/factions/3/photo.png', copied_to_target: false, name_taken_in_target: false,
    };
  });

  it('renders two cells', function() {
    expect(render().match(/<td>/g).length).toBe(2);
  });

  it('renders the cover thumbnail', function() {
    expect(render()).toContain('src="photos/games/a/factions/3/photo.png"');
  });

  it('renders the placeholder when the faction has no cover', function() {
    const html = render({ photo: null });

    expect(html).not.toContain('<img');
    expect(html).toContain(Translator.t('staff_photos_page.broken_image_alt'));
  });

  it('renders the faction name', function() {
    expect(render()).toContain('<td>Thieves Guild</td>');
  });

  it('renders no hidden badge', function() {
    expect(render()).not.toContain('staff-copy-hidden-badge');
  });
});
