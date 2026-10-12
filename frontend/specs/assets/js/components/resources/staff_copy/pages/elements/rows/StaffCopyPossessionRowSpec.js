import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyPossessionRow from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyPossessionRow.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyPossessionRow', function() {
  let row;

  const render = (overrides = {}) => renderToStaticMarkup(
    React.createElement('table', null, React.createElement('tbody', null, React.createElement('tr', null,
      React.createElement(StaffCopyPossessionRow, { row: { ...row, ...overrides }, selected: false, onToggle: jasmine.createSpy('onToggle') }),
    ))),
  );

  beforeEach(function() {
    row = {
      id: 7, name: 'Lucky Coin', hidden: false, photo: 'photos/games/a/possessions/7/photo.png', copied_to_target: false,
    };
  });

  it('renders three cells', function() {
    expect(render().match(/<td>/g).length).toBe(3);
  });

  it('renders the cover thumbnail', function() {
    expect(render()).toContain('src="photos/games/a/possessions/7/photo.png"');
  });

  it('renders the placeholder when the possession has no cover', function() {
    const html = render({ photo: null });

    expect(html).not.toContain('<img');
    expect(html).toContain(Translator.t('staff_photos_page.broken_image_alt'));
  });

  it('renders the possession name', function() {
    expect(render()).toContain('<td>Lucky Coin</td>');
  });

  it('renders the hidden badge when the possession is hidden', function() {
    const html = render({ hidden: true });

    expect(html).toContain('data-testid="staff-copy-hidden-badge"');
    expect(html).toContain(Translator.t('staff_copies_page.hidden_badge'));
  });

  it('renders an empty visibility cell when the possession is visible', function() {
    const html = render();

    expect(html).not.toContain('staff-copy-hidden-badge');
    expect(html).toContain('<td></td>');
  });
});
